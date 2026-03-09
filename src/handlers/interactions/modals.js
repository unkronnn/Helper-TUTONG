const { MessageFlags, TextDisplayBuilder, ContainerBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SeparatorBuilder, ThumbnailBuilder, SectionBuilder, SeparatorSpacingSize } = require('discord.js');
const config = require('../../config/config.json');
const { handlePurchaseFormModal, handleHelpFormModal, createTicket } = require('../ticketHandler');

// Generate transcript embed untuk ticket yang ditutup
const generateTicketTranscript = (channel, ticketData, closedBy, reason) => {
    const accentColor = parseInt(config.primaryColor, 16);

    const transcriptContainer = new ContainerBuilder()
        .setAccentColor(accentColor)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# Ticket Closed`)
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`• **Ticket ID:** ${ticketData.ticketId || 'N/A'}\n• **Opened By:** ${ticketData.creatorId ? `<@${ticketData.creatorId}>` : 'Unknown'}\n• **Closed By:** <@${closedBy.id}>`)
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`• **Open Time:** <t:${Math.floor(channel.createdTimestamp / 1000)}:f>\n• **Claimed By:** ${ticketData.claimedBy ? `<@${ticketData.claimedBy}>` : 'Not claimed'}\n• **Reason:** ${reason}`)
        );
    
    // Add View Threaded button
    const viewThreadBtn = new ButtonBuilder()
        .setLabel('View Threaded')
        .setStyle(ButtonStyle.Link)
        .setURL(channel.url);
    
    const buttonRow = new ActionRowBuilder().addComponents(viewThreadBtn);

    return { transcriptContainer, buttonRow };
};

async function handleModals(client, interaction) {
    if (interaction.customId === 'review_form_modal') {
        await handleReviewModal(client, interaction);
    } else if (interaction.customId === 'help_form_modal') {
        return await handleHelpFormModal(interaction, client);
    } else if (interaction.customId === 'purchase_form_modal') {
        return await handlePurchaseFormModal(interaction, client);
    } else if (interaction.customId === 'close_ticket_modal') {
        await handleCloseTicketModal(client, interaction);
    } else if (interaction.customId === 'middleman_buyer_form_modal') {
        return await handleMiddlemanBuyerFormModal(client, interaction);
    } else if (interaction.customId === 'middleman_seller_form_modal') {
        return await handleMiddlemanSellerFormModal(client, interaction);
    }
}


async function handleReviewModal(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const reviewChannelId = config.reviewChannelId || '1434067685682970654';
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
            .setContent(`## HAJI UTONG - User Feedback\n\nNew Review Submitted!`);

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
            .setStyle(ButtonStyle.Secondary);

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
                            
                            // Delete the notification message
                            await notifMessage.delete().catch(err => console.error('[NOTIF DELETE ERROR]', err.message));
                        }
                        
                        // Delete staff mention message
                        if (channel.staffMentionMessageId) {
                            await staffChannel.messages.delete(channel.staffMentionMessageId).catch(err => console.error('[STAFF MENTION DELETE ERROR]', err.message));
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

            // Send DM to ticket owner
            try {
                // Use creatorId which stores the actual user who opened the ticket
                const creatorId = channel.creatorId;
                if (creatorId) {
                    const ticketOwner = await client.users.fetch(creatorId).catch(() => null);
                    if (ticketOwner) {
                        // Determine ticket type
                        let ticketType = 'General Ticket';
                        if (channel.name.includes('purchase')) ticketType = 'Purchase';
                        if (channel.name.includes('help')) ticketType = 'Help';
                        if (channel.name.includes('midman')) ticketType = 'Middleman';

                        // Get created timestamp
                        const createdTime = Math.floor(channel.createdTimestamp / 1000);

                        // Get server icon/logo
                        const guild = interaction.guild;
                        const serverIcon = guild.iconURL({ size: 256, dynamic: true });
                        const serverThumbnail = serverIcon ? new ThumbnailBuilder({ media: { url: serverIcon } }) : null;

                        // Build header section with server icon
                        const headerSection = new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`## Ticket Closed\nThank you for using our service!`)
                            );
                        
                        if (serverThumbnail) {
                            headerSection.setThumbnailAccessory(serverThumbnail);
                        }

                        // Separator
                        const sep1 = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

                        // Ticket info section
                        const ticketInfo = new TextDisplayBuilder()
                            .setContent(`• **Ticket ID:** ${ticketId}\n• **Type:** ${ticketType}`);


                        // User info section
                        const userInfo = new TextDisplayBuilder()
                            .setContent(`• **Opened by:** <@${creatorId}>\n• **Closed by:** <@${interaction.user.id}>`);

                        const sep2 = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

                        // Time and claim info
                        const timeInfo = new TextDisplayBuilder()
                            .setContent(`• **Open Time:** <t:${createdTime}:f>\n• **Claimed By:** ${channel.claimedBy ? `<@${channel.claimedBy}>` : 'Not claimed'}`);


                        // Reason section
                        const reasonInfo = new TextDisplayBuilder()
                            .setContent(`• **Reason:** ${reason}`);

                        // Build DM embed
                        const dmContainer = new ContainerBuilder()
                            .setAccentColor(accentColor)
                            .addSectionComponents(headerSection)
                            .addSeparatorComponents(sep1)
                            .addTextDisplayComponents(ticketInfo)
                            .addTextDisplayComponents(userInfo)
                            .addSeparatorComponents(sep2)
                            .addTextDisplayComponents(timeInfo)
                            .addTextDisplayComponents(reasonInfo);

                        await ticketOwner.send({
                            components: [dmContainer],
                            flags: MessageFlags.IsComponentsV2,
                        }).catch(err => console.error('[DM SEND ERROR]', err.message));
                        
                        console.log(`[TICKETS] DM sent to ${ticketOwner.tag} for closed ticket ${channel.name}`);
                    }
                }
            } catch (dmErr) {
                console.error('[DM ERROR]', dmErr.message);
            }

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

async function handleMiddlemanBuyerFormModal(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const nama = interaction.fields.getTextInputValue('buyer_nama');
        const barang = interaction.fields.getTextInputValue('buyer_barang');
        const harga = interaction.fields.getTextInputValue('buyer_harga');
        const ket = interaction.fields.getTextInputValue('buyer_ket') || '-';

        // Send form data to ticket channel (visible to all)
        const ticketContainer = new ContainerBuilder();
        const ticketTitle = new TextDisplayBuilder()
            .setContent('## 📝 Form Pembeli');
        const separator1 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);
        const ticketContent = new TextDisplayBuilder()
            .setContent(
                `**Submitted by:** ${interaction.user}\n\n` +
                `**Nama Lengkap:** ${nama}\n` +
                `**Jenis Barang:** ${barang}\n` +
                `**Harga:** Rp ${harga}\n` +
                `**Keterangan:** ${ket}`
            );
        const separator2 = new SeparatorBuilder();
        const timestamp = new TextDisplayBuilder()
            .setContent(`*Submitted at: <t:${Math.floor(Date.now() / 1000)}:f>*`);

        ticketContainer
            .addTextDisplayComponents(ticketTitle)
            .addSeparatorComponents(separator1)
            .addTextDisplayComponents(ticketContent)
            .addSeparatorComponents(separator2)
            .addTextDisplayComponents(timestamp);

        // Send to ticket channel
        await interaction.channel.send({
            components: [ticketContainer],
            flags: MessageFlags.IsComponentsV2,
        });

        // Ephemeral confirmation (transparent)
        const formContainer = new ContainerBuilder();
        const titleSection = new TextDisplayBuilder()
            .setContent('## Form Pembeli - Middleman');
        const separator = new SeparatorBuilder();
        const contentSection = new TextDisplayBuilder()
            .setContent(
                `**Nama Lengkap:** ${nama}\n` +
                `**Jenis Barang:** ${barang}\n` +
                `**Harga:** Rp ${harga}\n` +
                `**Keterangan:** ${ket}`
            );

        formContainer
            .addTextDisplayComponents(titleSection)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(contentSection);

        await interaction.editReply({
            components: [formContainer],
            flags: MessageFlags.IsComponentsV2,
        });

        console.log(`[MIDDLEMAN] Buyer form submitted by ${interaction.user.tag}`);
    } catch (error) {
        console.error('[MIDDLEMAN BUYER FORM ERROR]', error.message);
        const errorBlock = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
            );
        await interaction.editReply({
            components: [errorBlock],
            flags: MessageFlags.IsComponentsV2,
        });
    }
}

async function handleMiddlemanSellerFormModal(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const nama = interaction.fields.getTextInputValue('seller_nama');
        const barang = interaction.fields.getTextInputValue('seller_barang');
        const harga = interaction.fields.getTextInputValue('seller_harga');
        const ket = interaction.fields.getTextInputValue('seller_ket') || '-';

        // Send form data to ticket channel (visible to all)
        const ticketContainer = new ContainerBuilder();
        const ticketTitle = new TextDisplayBuilder()
            .setContent('## 📝 Form Penjual');
        const separator1 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);
        const ticketContent = new TextDisplayBuilder()
            .setContent(
                `**Submitted by:** ${interaction.user}\n\n` +
                `**Nama Lengkap:** ${nama}\n` +
                `**Jenis Barang:** ${barang}\n` +
                `**Harga:** Rp ${harga}\n` +
                `**Keterangan:** ${ket}`
            );
        const separator2 = new SeparatorBuilder();
        const timestamp = new TextDisplayBuilder()
            .setContent(`*Submitted at: <t:${Math.floor(Date.now() / 1000)}:f>*`);

        ticketContainer
            .addTextDisplayComponents(ticketTitle)
            .addSeparatorComponents(separator1)
            .addTextDisplayComponents(ticketContent)
            .addSeparatorComponents(separator2)
            .addTextDisplayComponents(timestamp);

        // Send to ticket channel
        await interaction.channel.send({
            components: [ticketContainer],
            flags: MessageFlags.IsComponentsV2,
        });

        // Ephemeral confirmation (transparent)
        const formContainer = new ContainerBuilder();
        const titleSection = new TextDisplayBuilder()
            .setContent('## Form Penjual - Middleman');
        const separator = new SeparatorBuilder();
        const contentSection = new TextDisplayBuilder()
            .setContent(
                `**Nama Lengkap:** ${nama}\n` +
                `**Jenis Barang:** ${barang}\n` +
                `**Harga:** Rp ${harga}\n` +
                `**Keterangan:** ${ket}`
            );

        formContainer
            .addTextDisplayComponents(titleSection)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(contentSection);

        await interaction.editReply({
            components: [formContainer],
            flags: MessageFlags.IsComponentsV2,
        });

        console.log(`[MIDDLEMAN] Seller form submitted by ${interaction.user.tag}`);
    } catch (error) {
        console.error('[MIDDLEMAN SELLER FORM ERROR]', error.message);
        const errorBlock = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
            );
        await interaction.editReply({
            components: [errorBlock],
            flags: MessageFlags.IsComponentsV2,
        });
    }
}

module.exports = { handleModals };
