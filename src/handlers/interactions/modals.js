const { MessageFlags, TextDisplayBuilder, ContainerBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SeparatorBuilder, ThumbnailBuilder, SectionBuilder } = require('discord.js');
const config = require('../../config/config.json');
const { handlePurchaseFormModal } = require('../ticketHandler');

// Generate transcript embed untuk ticket yang ditutup
const generateTicketTranscript = (channel, ticketData, closedBy, reason) => {
    const accentColor = parseInt(config.primaryColor, 16);
    
    let ticketType = 'General Ticket';
    if (channel.name.includes('purchase')) ticketType = 'Purchase Ticket';
    if (channel.name.includes('help')) ticketType = 'Help Ticket';
    if (channel.name.includes('midman')) ticketType = 'Middleman Ticket';

    const transcriptContent = `${ticketType}

• **Ticket ID:** ${ticketData.ticketId || 'N/A'}
• **Opened By:** ${ticketData.creatorId ? `<@${ticketData.creatorId}>` : 'Unknown'}
• **Closed By:** ${closedBy.tag}

• **Open Time:** <t:${Math.floor(channel.createdTimestamp / 1000)}:f>
• **Claimed By:** ${ticketData.claimedBy ? `<@${ticketData.claimedBy}>` : 'Not claimed'}
• **Reason:** ${reason}`;

    const transcriptContainer = new ContainerBuilder()
        .setAccentColor(accentColor)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Ticket Closed - Transcript\n\n${transcriptContent}`)
        );
    
    // Add View Thread button
    const viewThreadBtn = new ButtonBuilder()
        .setLabel('View Thread')
        .setStyle(ButtonStyle.Link)
        .setURL(channel.url);
    
    const buttonRow = new ActionRowBuilder().addComponents(viewThreadBtn);

    return { transcriptContainer, buttonRow };
};

async function handleModals(client, interaction) {
    if (interaction.customId === 'review_form_modal') {
        await handleReviewModal(client, interaction);
    } else if (interaction.customId === 'purchase_form_modal') {
        return await handlePurchaseFormModal(interaction, client);
    } else if (interaction.customId === 'close_ticket_modal') {
        await handleCloseTicketModal(client, interaction);
    }
}

async function handleReviewModal(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const reviewChannelId = config.reviewChannelId || '1409205898634723409';
        const reviewChannel = await client.channels.fetch(reviewChannelId).catch(() => null);

        if (!reviewChannel) {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Review channel not found!')
                );
            return await interaction.editReply({
                components: [errorBlock],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const username = interaction.user.username;
        const reviewText = interaction.fields.getTextInputValue('review_text');
        const rating = parseInt(interaction.fields.getTextInputValue('review_rating')) || 5;

        // Validate rating
        const validRating = Math.min(Math.max(rating, 1), 5);
        const stars = '⭐'.repeat(validRating);

        // Get user avatar
        const userAvatar = interaction.user.displayAvatarURL({ size: 256, dynamic: true });
        const thumbnail = new ThumbnailBuilder({ media: { url: userAvatar } });

        const header = new TextDisplayBuilder()
            .setContent(`## Voxteria - User Feedback\n\nNew Review Submitted!`);

        const headerSection = new SectionBuilder()
            .addTextDisplayComponents(header)
            .setThumbnailAccessory(thumbnail);

        const userInfo = new TextDisplayBuilder()
            .setContent(`**User:** @${username}`);

        const descriptionLabel = new TextDisplayBuilder()
            .setContent(`**Description:**`);

        const reviewContent = new TextDisplayBuilder()
            .setContent(reviewText);

        const ratingDisplay = new TextDisplayBuilder()
            .setContent(`${stars} (${validRating}/5) • <t:${Math.floor(Date.now() / 1000)}:R>`);

        const sep = new SeparatorBuilder();

        const submitBtn = new ButtonBuilder()
            .setCustomId('review_submit')
            .setLabel('Submit A Review')
            .setStyle(ButtonStyle.Primary);

        const buttonRow = new ActionRowBuilder()
            .addComponents(submitBtn);

        const reviewContainer = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addSectionComponents(headerSection)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(userInfo)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(descriptionLabel)
            .addTextDisplayComponents(reviewContent)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(ratingDisplay);

        // Send review to channel
        await reviewChannel.send({
            components: [reviewContainer, buttonRow],
            flags: MessageFlags.IsComponentsV2,
        });

        const successBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`##✅ Thank you\n\nyour review has been submitted successfully!`)
            );

        await interaction.editReply({
            components: [successBlock],
            flags: MessageFlags.IsComponentsV2,
        });

        console.log(`[REVIEW] Review submitted by ${username} - Rating: ${validRating}/5`);
    } catch (error) {
        console.error('[REVIEW SUBMIT ERROR]', error.message);
        const errorBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
            );
        await interaction.editReply({
            components: [errorBlock],
            flags: MessageFlags.IsComponentsV2,
        });
    }
}

async function handleCloseTicketModal(client, interaction) {
    const channel = interaction.channel;
    const reason = interaction.fields.getTextInputValue('close_reason') || 'No reason provided';

    // Defer immediately to avoid timeout
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => null);

    if (channel && (channel.name.includes('purchase') || channel.name.includes('help') || channel.name.includes('midman'))) {
        try {
            const accentColor = parseInt(config.primaryColor, 16);

            // Try to extract ticketId dari notification message
            let ticketId = 'N/A';
            if (channel.notifMessageId) {
                try {
                    const staffChannel = await client.channels.fetch(config.channels.openedTickets).catch(() => null);
                    if (staffChannel) {
                        const notifMessage = await staffChannel.messages.fetch(channel.notifMessageId).catch(() => null);
                        if (notifMessage) {
                            // Extract dari message content
                            const match = notifMessage.content.match(/Ticket ID:\s*`?([A-Z0-9\-]+)`?/);
                            if (match) ticketId = match[1];
                        }
                    }
                } catch (e) {
                    // Silently fail
                }
            }

            const ticketData = {
                ticketId: ticketId,
                creatorId: channel.creatorId,
                claimedBy: channel.claimedBy,
                notifMessageId: channel.notifMessageId
            };

            // Send transcript to transcript channel
            try {
                const transcriptChannel = await client.channels.fetch(config.channels.transcripts).catch(() => null);
                if (transcriptChannel) {
                    const { transcriptContainer, buttonRow } = generateTicketTranscript(channel, ticketData, interaction.user, reason);
                    await transcriptChannel.send({
                        components: [transcriptContainer, buttonRow],
                        flags: MessageFlags.IsComponentsV2,
                    }).catch(err => console.error('[TRANSCRIPT SEND ERROR]', err.message));
                }
            } catch (transcriptErr) {
                console.error('[TRANSCRIPT ERROR]', transcriptErr.message);
            }

            // Lock and archive thread
            await channel.setLocked(true);
            await channel.setArchived(true);

            const closedBlock = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## Ticket Closed\n\n**Closed by:** ${interaction.user.tag}\n**Reason:** ${reason}\n**Closed at:** <t:${Math.floor(Date.now() / 1000)}:f>`)
                );

            await interaction.editReply({
                components: [closedBlock],
                flags: MessageFlags.IsComponentsV2,
            });

            console.log(`[TICKETS] Ticket ${channel.name} closed by ${interaction.user.tag} - Reason: ${reason}`);
        } catch (err) {
            console.error('[CLOSE TICKET ERROR]', err.message);
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`❌ Failed to close ticket!\n\n**Error:** ${err.message}`)
                );
            await interaction.editReply({
                components: [errorBlock],
                flags: MessageFlags.IsComponentsV2,
            });
        }
    } else {
        const errorBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('❌ This modal can only be used in tickets!')
            );
        await interaction.editReply({
            components: [errorBlock],
        });
    }
}

module.exports = { handleModals };
