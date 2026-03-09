const { MessageFlags, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, SeparatorBuilder, ContainerBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SeparatorSpacingSize } = require('discord.js');
const colors = require('colors');
const config = require('../config/config.json');
const setupLogger = require('./setupLogger');

/**
 * Creates a Voxtera Tickets System embed
 * @param {import('discord.js').Client} client
 * @returns {ContainerBuilder} The embed container
 */
function createTicketsSystemEmbed(client) {
    const container = new ContainerBuilder();

    // Get guild icon
    const guild = client.guilds.cache.first();
    const guildIconUrl = guild ? guild.iconURL({ size: 256, extension: 'png' }) : null;

    // Title with description and thumbnail (logo di samping kanan)
    const titleSection = new SectionBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('# HAJI UTONG - Tickets System'),
            new TextDisplayBuilder().setContent('Make sure you really have a clear need or requirement before creating a ticket!')
        );
    
    if (guildIconUrl) {
        titleSection.setThumbnailAccessory(new ThumbnailBuilder({ media: { url: guildIconUrl } }));
    }
    
    container.addSectionComponents(titleSection);

    // Large separator
    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large)
    );

    // Warning section with proper formatting
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# <:82470partnergray:1473667902233251840> IMPORTANT:\n• Do not create tickets just for fun or games, as this will distract our staff!\n• If your ticket is not answered for a long time, please tag the staff on duty.\n\n**If you are caught violating the above rules, we will not hesitate to blacklist you!**')
    );

    // Large separator
    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large)
    );

    // Create buttons and add to container via ActionRowBuilder
    const purchaseButton = new ButtonBuilder()
        .setCustomId('ticket_purchase')
        .setLabel('Purchase')
        .setStyle(ButtonStyle.Success);

    const helpButton = new ButtonBuilder()
        .setCustomId('ticket_help')
        .setLabel('Help')
        .setStyle(ButtonStyle.Secondary);

    const actionRow = new ActionRowBuilder().addComponents(purchaseButton, helpButton);
    container.addActionRowComponents(actionRow);
    return container;
}

/**
 * Creates a Voxtera Middleman embed with large separator and button
 * @param {import('discord.js').Client} client
 * @returns {ContainerBuilder} The embed container with button
 */
function createMiddlemanEmbed(client) {
    const container = new ContainerBuilder();

    // Get guild icon
    const guild = client.guilds.cache.first();
    const guildIconUrl = guild ? guild.iconURL({ size: 256, extension: 'png' }) : null;

    // Title with description and thumbnail (logo di samping kanan)
    const titleSection = new SectionBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('# HAJI UTONG - Middleman'),
            new TextDisplayBuilder().setContent('Untuk membuat ticket middleman, silakan klik tombol di bawah dan lengkapi semua data yang diperlukan dengan akurat.')
        );
    
    if (guildIconUrl) {
        titleSection.setThumbnailAccessory(new ThumbnailBuilder({ media: { url: guildIconUrl } }));
    }
    
    container.addSectionComponents(titleSection);

    // Large separator
    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large)
    );

    // Pricing section title
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(' <:9516moneywings:1473667846469849322> **Struktur Biaya Kami:**')
    );

    // Pricing details
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            '• Rp 10.000 - Rp 50.000 → Rp 2.000\n' +
            '• Rp 50.001 - Rp 100.000 → Rp 5.000\n' +
            '• Rp 100.001 - Rp 300.000 → Rp 10.000\n' +
            '• Rp 300.001 - Rp 500.000 → Rp 15.000\n' +
            '• Rp 500.001 - Rp 1.000.000 → Rp 25.000\n' +
            '• > Rp 1.000.000 → 2% flat'
        )
    );

    // Large separator
    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large)
    );

    // Create button
    const openTicketButton = new ButtonBuilder()
        .setCustomId('middleman_request')
        .setLabel('Open Ticket')
        .setStyle(ButtonStyle.Secondary);

    // Section with button accessory (button di samping text)
    const section = new SectionBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('Silahkan open ticket untuk melakukan Middleman')
        )
        .setButtonAccessory(openTicketButton);
    
    container.addSectionComponents(section);

    return container;
}

async function setupTickets(client) {
    try {
        const ticketChannel = await client.channels.fetch(config.channels.tickets);

        if (!ticketChannel) {
            console.log(colors.yellow(`[TICKETS] Channel tidak ditemukan (ID: ${config.channels.tickets})`));
            return;
        }

        // Delete semua pesan lama di channel
        let deletedMessagesCount = 0;
        try {
            const messages = await ticketChannel.messages.fetch({ limit: 100 });
            if (messages.size > 0) {
                await ticketChannel.bulkDelete(messages);
                deletedMessagesCount = messages.size;
            }
        } catch (deleteErr) {
            console.log(colors.yellow(`[TICKETS] Gagal hapus pesan lama: ${deleteErr.message}`));
        }

        // Build tickets embed
        const ticketEmbed = createTicketsSystemEmbed(client);

        // Send embed
        const ticketMessage = await ticketChannel.send({
            components: [ticketEmbed],
            flags: MessageFlags.IsComponentsV2,
        });

        setupLogger.logTickets(ticketMessage.id, ticketChannel.name, deletedMessagesCount);
    } catch (error) {
        console.error(colors.red('[TICKETS ERROR]'), error.message);
    }
}

async function setupMiddleman(client) {
    try {
        const middlemanChannel = await client.channels.fetch(config.channels.middleman);

        if (!middlemanChannel) {
            console.log(colors.yellow(`[MIDDLEMAN] Channel tidak ditemukan (ID: ${config.channels.middleman})`));
            return;
        }

        // Delete semua pesan lama di channel
        let deletedMiddlemanMessagesCount = 0;
        try {
            const messages = await middlemanChannel.messages.fetch({ limit: 100 });
            if (messages.size > 0) {
                await middlemanChannel.bulkDelete(messages);
                deletedMiddlemanMessagesCount = messages.size;
            }
        } catch (deleteErr) {
            console.log(colors.yellow(`[MIDDLEMAN] Gagal hapus pesan lama: ${deleteErr.message}`));
        }

        // Build middleman embed
        const middlemanEmbed = createMiddlemanEmbed(client);

        // Send embed
        const middlemanMessage = await middlemanChannel.send({
            components: [middlemanEmbed],
            flags: MessageFlags.IsComponentsV2,
        });

        setupLogger.logMiddleman(middlemanMessage.id, middlemanChannel.name, deletedMiddlemanMessagesCount);
    } catch (error) {
        console.error(colors.red('[MIDDLEMAN ERROR]'), error.message);
    }
}

module.exports = { setupTickets, setupMiddleman };
