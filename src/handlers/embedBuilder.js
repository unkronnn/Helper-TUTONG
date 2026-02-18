const { ContainerBuilder, SeparatorBuilder, TextDisplayBuilder, ButtonBuilder, ButtonStyle, SeparatorSpacingSize, ActionRowBuilder, SectionBuilder, ThumbnailBuilder } = require('discord.js');
const config = require('../config/config.json');

/**
 * Creates a HAJI UTONG Tickets System embed
 * @param {import('discord.js').Client} client
 * @returns {ContainerBuilder} The embed container
 */
function createTicketsSystemEmbed(client) {
    const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16));

    // Get guild icon
    const guild = client.guilds.cache.first();
    const guildIconUrl = guild ? guild.iconURL({ size: 256, extension: 'png' }) : null;

    // Title with description and thumbnail (logo di samping kanan)
    const titleSection = new SectionBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('# HAJI UTONG - Tickets System'),
            new TextDisplayBuilder().setContent('Make sure you really have a clear need or requirement before creating a ticket!')
        );
    
    // Only set thumbnail if icon URL is valid
    if (guildIconUrl) {
        try {
            const thumbnail = new ThumbnailBuilder({ media: { url: guildIconUrl } });
            titleSection.setThumbnailAccessory(thumbnail);
        } catch (err) {
            console.warn(`[TICKETS EMBED] Failed to set thumbnail: ${err.message}`);
        }
    }
    
    container.addSectionComponents(titleSection);

    // Large separator
    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large)
    );

    // Warning section with proper formatting
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('⚠️ **Please note:**\n• Do not create tickets just for fun or games, as this will distract our staff!\n• If your ticket is not answered for a long time, please tag the staff on duty.\n\n**If you are caught violating the above rules, we will not hesitate to blacklist you!**')
    );

    // Large separator
    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large)
    );

    // Create buttons and add to container via ActionRowBuilder
    const purchaseButton = new ButtonBuilder()
        .setCustomId('ticket_purchase')
        .setLabel('Purchase')
        .setStyle(ButtonStyle.Secondary);

    const helpButton = new ButtonBuilder()
        .setCustomId('ticket_help')
        .setLabel('Help')
        .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(purchaseButton, helpButton);
    container.addActionRowComponents(actionRow);
    return container;
}

/**
 * Creates a HAJI UTONG Middleman embed with large separator and button
 * @param {import('discord.js').Client} client
 * @returns {ContainerBuilder} The embed container with button
 */
function createMiddlemanEmbed(client) {
    const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16));

    // Get guild icon
    const guild = client.guilds.cache.first();
    const guildIconUrl = guild ? guild.iconURL({ size: 256, extension: 'png' }) : null;

    // Title with description and thumbnail (logo di samping kanan)
    const titleSection = new SectionBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('# HAJI UTONG - Middleman'),
            new TextDisplayBuilder().setContent('Untuk membuat ticket middleman, silakan klik tombol di bawah dan lengkapi semua data yang diperlukan dengan akurat.')
        );
    
    // Only set thumbnail if icon URL is valid
    if (guildIconUrl) {
        try {
            const thumbnail = new ThumbnailBuilder({ media: { url: guildIconUrl } });
            titleSection.setThumbnailAccessory(thumbnail);
        } catch (err) {
            console.warn(`[MIDDLEMAN EMBED] Failed to set thumbnail: ${err.message}`);
        }
    }
    
    container.addSectionComponents(titleSection);

    // Large separator
    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large)
    );

    // Pricing section title
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('### 💰 Fee Rekber')
    );

    // Pricing details
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            '- Rp 10.000 - Rp 50.000 → Rp 2.000\n' +
            '- Rp 50.001 - Rp 100.000 → Rp 5.000\n' +
            '- Rp 100.001 - Rp 300.000 → Rp 10.000\n' +
            '- Rp 300.001 - Rp 500.000 → Rp 15.000\n' +
            '- Rp 500.001 - Rp 1.000.000 → Rp 25.000\n' +
            '- > Rp 1.000.000 → 2% flat'
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

/**
 * Creates buttons for Middleman embed
 * @returns {Array} Array of ActionRowBuilder containing buttons
 */
function getMiddlemanButtons() {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('middleman_request')
                .setLabel('Open Ticket')
                .setStyle(ButtonStyle.Success)
        );

    return [row];
}

module.exports = {
    createTicketsSystemEmbed,
    createMiddlemanEmbed,
    getMiddlemanButtons
};
