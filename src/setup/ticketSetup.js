const { MessageFlags, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, SeparatorBuilder, ContainerBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const colors = require('colors');
const config = require('../config/config.json');
const setupLogger = require('./setupLogger');

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

        // Build tickets embed dengan v2 components
        const accentColor = parseInt(config.primaryColor, 16);
        const guild = ticketChannel.guild;
        const serverIconURL = guild.iconURL({ extension: 'png', size: 128 });

        // Header dengan server name dan icon
        const headerText = new TextDisplayBuilder()
            .setContent(`# **${guild.name}** - **Tickets System**`);

        const thumbnail = new ThumbnailBuilder({ media: { url: serverIconURL } });
        const headerSection = new SectionBuilder()
            .addTextDisplayComponents(headerText)
            .setThumbnailAccessory(thumbnail);

        const description = new TextDisplayBuilder()
            .setContent('Sebelum membuat ticket, pastikan kamu benar-benar memiliki kebutuhan atau keperluan yang jelas.');

        const warning = new TextDisplayBuilder()
            .setContent('## ⚠️ **Harap diperhatikan:**\n• Jangan membuat ticket hanya untuk iseng atau main-main, karena ini akan mengganggu staff kami!\n• Jika ticket kamu tidak dibalas dalam waktu yang lama, silahkan tag staff yang bertugas.');

        const rules = new TextDisplayBuilder()
            .setContent('## 📌 **Peraturan:**\nJika kamu ketahuan melanggar peraturan di atas, kami tidak akan segan-segan untuk memasukan kamu ke blacklist!');

        const sep = new SeparatorBuilder();

        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addSectionComponents(headerSection)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(description)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(warning)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(rules);

        const purchaseBtn = new ButtonBuilder()
            .setCustomId('ticket_purchase')
            .setLabel('Purchase')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💳');

        const helpBtn = new ButtonBuilder()
            .setCustomId('ticket_help')
            .setLabel('Bantuan')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❓');

        const buttonRow = new ActionRowBuilder()
            .addComponents(purchaseBtn, helpBtn);

        // Send embed
        const ticketMessage = await ticketChannel.send({
            components: [container, buttonRow],
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

        // Build middleman embed dengan v2 components
        const accentColor = parseInt(config.primaryColor, 16);
        const guild = middlemanChannel.guild;
        const serverIconURL = guild.iconURL({ extension: 'png', size: 128 });

        // Header dengan server name dan icon
        const headerText = new TextDisplayBuilder()
            .setContent(`# **${guild.name}** - **Middleman**`);

        const thumbnail = new ThumbnailBuilder({ media: { url: serverIconURL } });
        const headerSection = new SectionBuilder()
            .addTextDisplayComponents(headerText)
            .setThumbnailAccessory(thumbnail);

        const description = new TextDisplayBuilder()
            .setContent('Kami siap membantu menjamin keamanan transaksi kamu. Untuk membuat request middleman, silakan klik tombol di bawah dan lengkapi semua data yang diperlukan dengan akurat.');

        const pricingStructure = new TextDisplayBuilder()
            .setContent('## 💰 **Struktur Biaya Kami:**\n• Rp 10.000 - Rp 50.000 → Rp 2.000\n• Rp 50.001 - Rp 100.000 → Rp 5.000\n• Rp 100.001 - Rp 300.000 → Rp 10.000\n• Rp 300.001 - Rp 500.000 → Rp 15.000\n• Rp 500.001 - Rp 1.000.000 → Rp 25.000\n• > Rp 1.000.000 → 2% flat');

        const warning = new TextDisplayBuilder()
            .setContent('## 🚨 **Harap diperhatikan:**\n• Jangan membuat request hanya untuk iseng atau main-main\n• Pastikan data pembeli dan penjual sudah akurat\n• Hindari transaksi ilegal atau mencurigakan');

        const sep = new SeparatorBuilder();

        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addSectionComponents(headerSection)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(description)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(pricingStructure)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(warning);

        const requestBtn = new ButtonBuilder()
            .setCustomId('middleman_request')
            .setLabel('Open Ticket')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🤝');

        const buttonRow = new ActionRowBuilder()
            .addComponents(requestBtn);

        // Send embed
        const middlemanMessage = await middlemanChannel.send({
            components: [container, buttonRow],
            flags: MessageFlags.IsComponentsV2,
        });

        setupLogger.logMiddleman(middlemanMessage.id, middlemanChannel.name, deletedMiddlemanMessagesCount);
    } catch (error) {
        console.error(colors.red('[MIDDLEMAN ERROR]'), error.message);
    }
}

module.exports = { setupTickets, setupMiddleman };
