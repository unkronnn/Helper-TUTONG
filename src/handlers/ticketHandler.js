const {
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    SeparatorBuilder,
    UserSelectMenuBuilder,
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    SectionBuilder,
    ThumbnailBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} = require('discord.js');
const config = require('../config/config.json');
const fs = require('fs');
const path = require('path');
const logger = require('../console/logger');

// ==================== HELPER FUNCTIONS ====================

const getStatus = () => {
    try {
        const statusFile = path.join(__dirname, '../config/status.json');
        logger.debug(`[TICKET] Reading status file from: ${statusFile}`);
        const data = fs.readFileSync(statusFile, 'utf8');
        logger.debug(`[TICKET] File content: ${data}`);
        const parsed = JSON.parse(data);
        logger.debug(`[TICKET] Parsed status: ${JSON.stringify(parsed)}`);
        return parsed;
    } catch (err) {
        logger.error('[TICKET] getStatus error: ' + err.message);
        return { isOpen: true }; // default to open
    }
};

const checkUserTicketCount = async (userId, client) => {
    try {
        const ticketChannel = await client.channels.fetch(config.ticketChannelId);
        if (!ticketChannel) {
            logger.warn('[TICKET COUNT] Channel not found');
            return 0;
        }
        
        const threads = await ticketChannel.threads.fetch({ archived: false });
        let userTicketCount = 0;
        
        logger.debug(`[TICKET COUNT] Checking threads for user ${userId}`);
        for (const [id, thread] of threads) {
            logger.debug(`[TICKET COUNT] Thread: ${thread.name}, Owner: ${thread.ownerId}, Starts with midman: ${thread.name.startsWith('midman-')}`);
            if (thread.ownerId === userId && !thread.name.startsWith('midman-')) {
                userTicketCount++;
                logger.debug(`[TICKET COUNT] Found ticket by user: ${thread.name}`);
            }
        }
        
        logger.debug(`[TICKET COUNT] Total user tickets (excluding midman): ${userTicketCount}`);
        return userTicketCount;
    } catch (err) {
        console.error('[TICKET COUNT ERROR]', err.message);
        return 0;
    }
};

// ==================== TICKET BUTTON HANDLERS ====================

async function handleTicketPurchaseButton(interaction, client) {
    // Check status
    const status = getStatus();
    if (status.isOpen === false) {
        logger.debug(`[TICKET] User ${interaction.user.tag} blocked from purchase - toko tutup`);
        const errorBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('❌ Toko sedang tutup! Tidak bisa membeli sekarang.')
            );
        return await interaction.reply({
            components: [errorBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    }

    const purchaseModal = new ModalBuilder()
        .setCustomId('purchase_form_modal')
        .setTitle('Purchase Form');

    const productInput = new TextInputBuilder()
        .setCustomId('purchase_product')
        .setLabel('Nama Produk/Item yang ingin Kamu Beli')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const methodInput = new TextInputBuilder()
        .setCustomId('purchase_method')
        .setLabel('Metode Pembayaran')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('QRIS/Bank Jago/Seabank')
        .setRequired(true);

    const notesInput = new TextInputBuilder()
        .setCustomId('purchase_notes')
        .setLabel('Catatan')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Ada request khusus? Tulis disini!')
        .setRequired(false);

    const row1 = new ActionRowBuilder().addComponents(productInput);
    const row2 = new ActionRowBuilder().addComponents(methodInput);
    const row3 = new ActionRowBuilder().addComponents(notesInput);

    purchaseModal.addComponents(row1, row2, row3);
    return await interaction.showModal(purchaseModal);
}

async function handleTicketHelpButton(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        // Check status
        const status = getStatus();
        logger.debug(`[TICKET] Status check: isOpen=${status.isOpen}, type=${typeof status.isOpen}`);
        
        // Safety check
        if (status.isOpen === undefined) {
            console.warn('[TICKET] WARNING: status.isOpen is undefined! Defaulting to allowing tickets.');
        }
        
        if (status.isOpen === false) {
            logger.debug(`[TICKET] User ${interaction.user.tag} blocked - toko tutup`);
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Toko sedang tutup! Tidak bisa membuka ticket sekarang.')
                );
            return await interaction.editReply({
                components: [errorBlock],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        // Check ticket count
        const ticketCount = await checkUserTicketCount(interaction.user.id, client);
        logger.debug(`[TICKET] User ${interaction.user.tag} has ${ticketCount} ticket(s)`);
        if (ticketCount >= 1) {
            logger.debug(`[TICKET] User ${interaction.user.tag} blocked - sudah punya ticket`);
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Kamu sudah membuka 1 ticket! Tutup ticket lama kamu terlebih dahulu sebelum membuka ticket baru.')
                );
            return await interaction.editReply({
                components: [errorBlock],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const ticketChannel = await client.channels.fetch(config.ticketChannelId);

        if (!ticketChannel) {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Channel ticket tidak ditemukan!')
                );
            return await interaction.editReply({
                components: [errorBlock],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const threadName = `help-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const accentColor = parseInt(config.color.replace('#', ''), 16);

        const title = new TextDisplayBuilder()
            .setContent('# Tickets System - Help');

        const description = new TextDisplayBuilder()
            .setContent(`Terima kasih sudah membuat ticket.
Silahkan tuliskan kebutuhan kamu dengan jelas agar tim kami bisa membantu lebih cepat!

## 🚫 **Catatan:**
• Mohon gunakan ticket ini sesuai kebutuhan (order, bantuan, atau midman).
• Hindari membuka ticket hanya untuk iseng, karena bisa berakibat blacklist.
• Jika kamu sudah menuliskan detail, harap tunggu respon dari tim kami.

Terima kasih atas pengertian dan kerjasamanya! 🙏`);

        const userInfo = new TextDisplayBuilder()
            .setContent(`**User:** ${interaction.user.tag}\n**Created:** <t:${Math.floor(Date.now() / 1000)}:f>`);

        const sep = new SeparatorBuilder();

        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(title)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(description)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(userInfo);

        const closeBtn = new ButtonBuilder()
            .setCustomId('ticket_close')
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger);

        const claimBtn = new ButtonBuilder()
            .setCustomId('ticket_claim')
            .setLabel('Claim Ticket')
            .setStyle(ButtonStyle.Primary);

        const addMemberBtn = new ButtonBuilder()
            .setCustomId('ticket_add')
            .setLabel('Add Member')
            .setStyle(ButtonStyle.Secondary);

        const buttonRow = new ActionRowBuilder()
            .addComponents(closeBtn, claimBtn, addMemberBtn);

        const newTicket = await ticketChannel.threads.create({
            name: threadName,
            autoArchiveDuration: 10080,
            reason: `Ticket created by ${interaction.user.tag}`,
            type: ChannelType.PrivateThread,
        });

        await newTicket.send({
            components: [container, buttonRow],
            flags: MessageFlags.IsComponentsV2,
        });

        await newTicket.members.add(interaction.user.id);

        // Send staff notification
        try {
            const staffChannel = await client.channels.fetch(config.notificationChannelId);
            if (staffChannel) {
                const ticketId = `${interaction.guild.name.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
                const userAvatar = interaction.user.displayAvatarURL({ size: 256, dynamic: true });

                const thumbnail = new ThumbnailBuilder({ media: { url: userAvatar } });
                const notifTitle = new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## **🎫 Join Ticket**\n\n**A Help Ticket is Opened!**`))
                    .setThumbnailAccessory(thumbnail);

                const ticketDetails = new TextDisplayBuilder()
                    .setContent(`• **Ticket ID:** ${ticketId}\n• **Type:** Help\n• **Opened by:** <@${interaction.user.id}>\n• **Claimed by:** Not claimed yet`);

                const staffCount = new TextDisplayBuilder()
                    .setContent(`• **Staff in Ticket:** 0\n• **Staff Members:** None`);

                const staffPing = new TextDisplayBuilder()
                    .setContent(`<@&${config.staffRoleId}> - Ticket Baru!`);

                const notifSep = new SeparatorBuilder();
                const notifContainer = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(staffPing)
                    .addSeparatorComponents(notifSep)
                    .addSectionComponents(notifTitle)
                    .addSeparatorComponents(notifSep)
                    .addTextDisplayComponents(ticketDetails)
                    .addSeparatorComponents(notifSep)
                    .addTextDisplayComponents(staffCount);

                const joinBtn = new ButtonBuilder()
                    .setCustomId(`ticket_join_${newTicket.id}`)
                    .setLabel('Join Ticket')
                    .setStyle(ButtonStyle.Secondary);

                const notifButtonRow = new ActionRowBuilder().addComponents(joinBtn);

                const notifMessage = await staffChannel.send({
                    components: [notifContainer, notifButtonRow],
                    flags: MessageFlags.IsComponentsV2,
                });

                newTicket.ticketId = ticketId;
                newTicket.notifMessageId = notifMessage.id;
                newTicket.staffMembers = [];
                newTicket.claimedBy = null;
                newTicket.creatorId = interaction.user.id;
            }
        } catch (notifErr) {
            console.error('[TICKETS NOTIF ERROR]', notifErr.message);
        }

        const replyTitle = new TextDisplayBuilder().setContent(`## 🎫 **Ticket**`);
        const replyDesc = new TextDisplayBuilder().setContent(`Opened a new ticket: <#${newTicket.id}>`);
        const replySep = new SeparatorBuilder();

        const replyContainer = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(replyTitle)
            .addSeparatorComponents(replySep)
            .addTextDisplayComponents(replyDesc);

        await interaction.editReply({
            components: [replyContainer],
            flags: MessageFlags.IsComponentsV2,
        });

        logger.info(`[TICKETS] ✓ Ticket ready: ${newTicket.name}`);
    } catch (error) {
        console.error('[TICKETS ERROR]', error.message);
        try {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
                );
            
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    components: [errorBlock],
                    flags: MessageFlags.IsComponentsV2,
                });
            } else {
                await interaction.reply({
                    components: [errorBlock],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }
        } catch (replyErr) {
            console.error('[TICKETS REPLY ERROR]', replyErr.message);
        }
    }
}

async function handleTicketAddButton(interaction, client) {
    const userSelect = new UserSelectMenuBuilder()
        .setCustomId('ticket_add_user')
        .setPlaceholder('Select a user');

    const selectRow = new ActionRowBuilder().addComponents(userSelect);

    const titleBlock = new TextDisplayBuilder()
        .setContent('👥 **Pilih user untuk ditambahkan ke ticket:**');

    const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
        .addTextDisplayComponents(titleBlock);

    await interaction.reply({
        components: [container, selectRow],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
}

async function handleMiddlemanAddButton(interaction, client) {
    const userSelect = new UserSelectMenuBuilder()
        .setCustomId('middleman_add_user')
        .setPlaceholder('Select pembeli atau penjual');

    const selectRow = new ActionRowBuilder().addComponents(userSelect);

    const titleBlock = new TextDisplayBuilder()
        .setContent('👥 **Pilih pembeli atau penjual untuk ditambahkan ke request:**');

    const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
        .addTextDisplayComponents(titleBlock);

    await interaction.reply({
        components: [container, selectRow],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
}

// ==================== MIDDLEMAN BUTTON HANDLERS ====================

async function handleMiddlemanRequestButton(interaction, client) {
    // Check if store is open
    const status = getStatus();
    if (status.isOpen === false) {
        logger.debug(`[TICKET] User ${interaction.user.tag} blocked - toko tutup (middleman request)`);
        const errorBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('❌ Toko sedang tutup! Tidak bisa membuka middleman request sekarang.')
            );
        return await interaction.reply({
            components: [errorBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    }

    const rangeSelect = new StringSelectMenuBuilder()
        .setCustomId('middleman_range_select')
        .setPlaceholder('Pilih range transaksi kamu')
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('Rp 10.000 - Rp 50.000')
                .setValue('1')
                .setDescription('Biaya: Rp 2.000'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Rp 50.001 - Rp 100.000')
                .setValue('2')
                .setDescription('Biaya: Rp 5.000'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Rp 100.001 - Rp 300.000')
                .setValue('3')
                .setDescription('Biaya: Rp 10.000'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Rp 300.001 - Rp 500.000')
                .setValue('4')
                .setDescription('Biaya: Rp 15.000'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Rp 500.001 - Rp 1.000.000')
                .setValue('5')
                .setDescription('Biaya: Rp 25.000'),
            new StringSelectMenuOptionBuilder()
                .setLabel('> Rp 1.000.000')
                .setValue('6')
                .setDescription('Biaya: 2% flat')
        );

    const selectRow = new ActionRowBuilder().addComponents(rangeSelect);

    const titleBlock = new TextDisplayBuilder()
        .setContent('# Voxteria - Middleman\n**Pilih Range Transaksi**\n\nSilahkan pilih range transaksi kamu!');

    const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
        .addTextDisplayComponents(titleBlock);

    await interaction.reply({
        components: [container, selectRow],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
}

async function handleMiddlemanHelpButton(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        // Check status - block if store is closed
        const status = getStatus();
        if (status.isOpen === false) {
            logger.debug(`[TICKET] User ${interaction.user.tag} blocked - toko tutup (middleman help)`);
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Toko sedang tutup! Tidak bisa membuka middleman help sekarang.')
                );
            return await interaction.editReply({
                components: [errorBlock],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const middlemanChannel = await client.channels.fetch(config.middlemanChannelId);

        if (!middlemanChannel) {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Channel middleman tidak ditemukan!')
                );
            return await interaction.editReply({
                components: [errorBlock],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const threadName = `help-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const accentColor = parseInt(config.color.replace('#', ''), 16);

        const title = new TextDisplayBuilder().setContent('# Middleman System - Help');
        const description = new TextDisplayBuilder().setContent(`Terima kasih sudah membuat request middleman.
Silahkan tuliskan kebutuhan kamu dengan jelas agar tim kami bisa membantu lebih cepat!

## 🚫 **Catatan:**
• Mohon gunakan request ini sesuai kebutuhan middleman/rekber.
• Hindari membuka request hanya untuk iseng, karena bisa berakibat blacklist.
• Jika request kamu tidak direspon dalam waktu yang lama, silahkan tag staff yang bertugas.

Terima kasih atas pengertian dan kerjasamanya! 🙏`);

        const userInfo = new TextDisplayBuilder()
            .setContent(`**User:** ${interaction.user.tag}\n**Created:** <t:${Math.floor(Date.now() / 1000)}:f>`);

        const sep = new SeparatorBuilder();

        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(title)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(description)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(userInfo);

        const closeBtn = new ButtonBuilder()
            .setCustomId('middleman_close')
            .setLabel('Close Request')
            .setStyle(ButtonStyle.Danger);

        const claimBtn = new ButtonBuilder()
            .setCustomId('middleman_claim')
            .setLabel('Claim Request')
            .setStyle(ButtonStyle.Primary);

        const addMemberBtn = new ButtonBuilder()
            .setCustomId('middleman_add')
            .setLabel('Add Member')
            .setStyle(ButtonStyle.Secondary);

        const buttonRow = new ActionRowBuilder()
            .addComponents(closeBtn, claimBtn, addMemberBtn);

        const newRequest = await middlemanChannel.threads.create({
            name: threadName,
            autoArchiveDuration: 10080,
            reason: `Middleman request created by ${interaction.user.tag}`,
            type: ChannelType.PrivateThread,
        });

        await newRequest.send({
            components: [container, buttonRow],
            flags: MessageFlags.IsComponentsV2,
        });

        // Send form template
        try {
            await newRequest.send({
                content: `## 📋 **Form Middleman**

Silahkan isi form di bawah ini:

\`\`\`
Penjual : 
Pembeli : 
Jenis Barang yang Dijual : 
Harga Barang yang Dijual : Rp. 
Inc/Ex :
\`\`\`

**Catatan:**
• Inc = Harga sudah termasuk biaya middleman
• Ex = Harga belum termasuk biaya middleman`
            });
            logger.info('[FORM] ✓ Form sent successfully to help button thread');
        } catch (formErr) {
            console.error('[FORM ERROR - HELP BUTTON]', formErr);
        }

        await newRequest.members.add(interaction.user.id);

        // Send staff notification
        try {
            const staffChannel = await client.channels.fetch(config.notificationChannelId);
            if (staffChannel) {
                const requestId = `MID-${interaction.guild.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
                const userAvatar = interaction.user.displayAvatarURL({ size: 256, dynamic: true });

                const thumbnail = new ThumbnailBuilder({ media: { url: userAvatar } });
                const notifTitle = new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## **🤝 Middleman Ticket**\n\n**A Middleman Ticket is Opened!**`))
                    .setThumbnailAccessory(thumbnail);

                const requestDetails = new TextDisplayBuilder()
                    .setContent(`• **Request ID:** ${requestId}\n• **Type:** Middleman\n• **Opened by:** <@${interaction.user.id}>\n• **Claimed by:** Not claimed yet`);

                const staffCount = new TextDisplayBuilder()
                    .setContent(`• **Staff in Request:** 0\n• **Staff Members:** None`);

                const notifSep = new SeparatorBuilder();
                const notifContainer = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addSectionComponents(notifTitle)
                    .addSeparatorComponents(notifSep)
                    .addTextDisplayComponents(requestDetails)
                    .addSeparatorComponents(notifSep)
                    .addTextDisplayComponents(staffCount);

                const joinBtn = new ButtonBuilder()
                    .setCustomId(`middleman_join_${newRequest.id}`)
                    .setLabel('Join Request')
                    .setStyle(ButtonStyle.Secondary);

                const notifButtonRow = new ActionRowBuilder().addComponents(joinBtn);

                const notifMessage = await staffChannel.send({
                    content: `<@&${config.staffRoleId}>`,
                    components: [notifContainer, notifButtonRow],
                });

                newRequest.requestId = requestId;
                newRequest.notifMessageId = notifMessage.id;
                newRequest.staffMembers = [];
                newRequest.claimedBy = null;
                newRequest.creatorId = interaction.user.id;

                logger.info(`[MIDDLEMAN] Notifikasi sent to staff channel - Request ID: ${requestId}`);
            }
        } catch (notifErr) {
            console.error('[MIDDLEMAN NOTIF ERROR]', notifErr.message);
        }

        const replyTitle = new TextDisplayBuilder().setContent(`## 🤝 **Middleman Ticket**`);
        const replyDesc = new TextDisplayBuilder().setContent(`Opened a new middleman ticket: <#${newRequest.id}>`);
        const replySep = new SeparatorBuilder();

        const replyContainer = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(replyTitle)
            .addSeparatorComponents(replySep)
            .addTextDisplayComponents(replyDesc);

        await interaction.editReply({
            components: [replyContainer],
            flags: MessageFlags.IsComponentsV2,
        });

        logger.info(`[MIDDLEMAN] ✓ Request ready: ${newRequest.name}`);
    } catch (error) {
        console.error('[MIDDLEMAN ERROR]', error.message);
        try {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
                );
            
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    components: [errorBlock],
                    flags: MessageFlags.IsComponentsV2,
                });
            } else {
                await interaction.reply({
                    components: [errorBlock],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }
        } catch (replyErr) {
            console.error('[MIDDLEMAN REPLY ERROR]', replyErr.message);
        }
    }
}

// ==================== MIDDLEMAN MODAL HANDLER ====================

async function handleMiddlemanRequestModal(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const middlemanChannel = await client.channels.fetch(config.middlemanChannelId);

        if (!middlemanChannel) {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Channel middleman tidak ditemukan!')
                );
            return await interaction.editReply({
                components: [errorBlock],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const rangeInput = interaction.fields.getTextInputValue('middleman_range');
        const notes = interaction.fields.getTextInputValue('middleman_notes') || '-';

        // Validate range input
        if (!['1', '2', '3', '4', '5', '6'].includes(rangeInput.trim())) {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Range transaksi harus 1-6!')
                );
            return await interaction.editReply({
                components: [errorBlock],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const rangeMap = {
            '1': 'Rp 10.000 - Rp 50.000',
            '2': 'Rp 50.001 - Rp 100.000',
            '3': 'Rp 100.001 - Rp 300.000',
            '4': 'Rp 300.001 - Rp 500.000',
            '5': 'Rp 500.001 - Rp 1.000.000',
            '6': '> Rp 1.000.000'
        };

        const threadName = `midman-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const accentColor = parseInt(config.color.replace('#', ''), 16);

        const title = new TextDisplayBuilder().setContent('# Voxteria - Middleman');
        const description = new TextDisplayBuilder().setContent(`Terima kasih sudah membuat request middleman.
Silahkan tambahkan pembeli dan penjual ke thread ini, kemudian tunggu tim staff kami untuk mengkonfirmasi request kamu.

## 🚫 **Catatan:**
• Klik tombol "Add Member" untuk menambahkan pembeli dan penjual.
• Tim staff akan memverifikasi request kamu.
• Hindari membuat request bohongan, karena bisa berakibat blacklist.

Terima kasih atas kepercayaan kamu! 🙏`);

        const transactionInfo = new TextDisplayBuilder()
            .setContent(`**Range Transaksi:** ${rangeMap[rangeInput.trim()]}\n**Catatan:** ${notes}`);

        const userInfo = new TextDisplayBuilder()
            .setContent(`**User:** ${interaction.user.tag}\n**Created:** <t:${Math.floor(Date.now() / 1000)}:f>`);

        const sep = new SeparatorBuilder();

        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(title)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(description)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(transactionInfo)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(userInfo);

        const closeBtn = new ButtonBuilder()
            .setCustomId('middleman_close')
            .setLabel('Close Request')
            .setStyle(ButtonStyle.Danger);

        const claimBtn = new ButtonBuilder()
            .setCustomId('middleman_claim')
            .setLabel('Claim Request')
            .setStyle(ButtonStyle.Primary);

        const addMemberBtn = new ButtonBuilder()
            .setCustomId('middleman_add')
            .setLabel('Add Member')
            .setStyle(ButtonStyle.Secondary);

        const buttonRow = new ActionRowBuilder()
            .addComponents(closeBtn, claimBtn, addMemberBtn);

        const newRequest = await middlemanChannel.threads.create({
            name: threadName,
            autoArchiveDuration: 10080,
            reason: `Middleman request created by ${interaction.user.tag}`,
            type: ChannelType.PrivateThread,
        });

        await newRequest.send({
            components: [container, buttonRow],
            flags: MessageFlags.IsComponentsV2,
        });

        // Send form template - MODAL
        try {
            await newRequest.send({
                content: `## 📋 **Form Middleman**

Silahkan isi form di bawah ini:

\`\`\`
Penjual : 
Pembeli : 
Jenis Barang yang Dijual : 
Harga Barang yang Dijual : Rp. 
Inc/Ex :
\`\`\`

**Catatan:**
• Inc = Harga sudah termasuk biaya middleman
• Ex = Harga belum termasuk biaya middleman`
            });
            logger.info('[FORM] ✓ Form sent successfully to modal thread');
        } catch (formErr) {
            console.error('[FORM ERROR - MODAL]', formErr);
        }

        await newRequest.members.add(interaction.user.id);

        // Send staff notification
        try {
            const staffChannel = await client.channels.fetch(config.notificationChannelId);
            if (staffChannel) {
                const requestId = `MID-${interaction.guild.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
                const userAvatar = interaction.user.displayAvatarURL({ size: 256, dynamic: true });

                const thumbnail = new ThumbnailBuilder({ media: { url: userAvatar } });
                const notifTitle = new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## **Join Ticket**\n\n**A Middleman Ticket is Opened!**`))
                    .setThumbnailAccessory(thumbnail);

                const requestDetails = new TextDisplayBuilder()
                    .setContent(`• **Request ID:** ${requestId}\n• **Type:** Transaction\n• **Opened by:** <@${interaction.user.id}>\n• **Claimed by:** Not claimed yet\n• **Range:** ${rangeMap[rangeInput.trim()]}`);

                const staffCount = new TextDisplayBuilder()
                    .setContent(`• **Staff in Request:** 0\n• **Staff Members:** None`);

                const notifSep = new SeparatorBuilder();
                
                const notifContainer = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addSectionComponents(notifTitle)
                    .addSeparatorComponents(notifSep)
                    .addTextDisplayComponents(requestDetails)
                    .addSeparatorComponents(notifSep)
                    .addTextDisplayComponents(staffCount);

                const joinBtn = new ButtonBuilder()
                    .setCustomId(`middleman_join_${newRequest.id}`)
                    .setLabel('Join Request')
                    .setStyle(ButtonStyle.Secondary);

                const notifButtonRow = new ActionRowBuilder().addComponents(joinBtn);

                const notifMessage = await staffChannel.send({
                    content: `<@&${config.staffRoleId}>`,
                    components: [notifContainer, notifButtonRow],
                });

                newRequest.requestId = requestId;
                newRequest.notifMessageId = notifMessage.id;
                newRequest.staffMembers = [];
                newRequest.claimedBy = null;
                newRequest.creatorId = interaction.user.id;
                newRequest.range = rangeMap[rangeInput.trim()];
                newRequest.notes = notes;

                logger.info(`[MIDDLEMAN] Notifikasi sent to staff channel - Request ID: ${requestId}`);
            }
        } catch (notifErr) {
            console.error('[MIDDLEMAN NOTIF ERROR]', notifErr.message);
        }

        const replyTitle = new TextDisplayBuilder().setContent(`## 🤝 Voxteria - Middleman`);
        const replyDesc = new TextDisplayBuilder().setContent(`Ticket kamu sudah dibuat: <#${newRequest.id}>\n\nTunggu staff kami untuk mengklaim dan memproses request kamu.`);
        const replySep = new SeparatorBuilder();

        const replyContainer = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(replyTitle)
            .addSeparatorComponents(replySep)
            .addTextDisplayComponents(replyDesc);

        await interaction.editReply({
            components: [replyContainer],
            flags: MessageFlags.IsComponentsV2,
        });

        logger.info(`[MIDDLEMAN] ✓ Request ready: ${newRequest.name}`);
    } catch (error) {
        console.error('[MIDDLEMAN ERROR]', error.message);
        try {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
                );
            
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    components: [errorBlock],
                    flags: MessageFlags.IsComponentsV2,
                });
            } else {
                await interaction.reply({
                    components: [errorBlock],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }
        } catch (replyErr) {
            console.error('[MIDDLEMAN REPLY ERROR]', replyErr.message);
        }
    }
}

// ==================== TICKET MODAL HANDLER ====================

async function handlePurchaseFormModal(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const ticketChannel = await client.channels.fetch(config.ticketChannelId);

        if (!ticketChannel) {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Channel ticket tidak ditemukan!')
                );
            return await interaction.editReply({
                components: [errorBlock],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const productName = interaction.fields.getTextInputValue('purchase_product');
        const paymentMethod = interaction.fields.getTextInputValue('purchase_method');
        const notes = interaction.fields.getTextInputValue('purchase_notes') || '-';

        const threadName = `purchase-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const accentColor = parseInt(config.color.replace('#', ''), 16);

        const title = new TextDisplayBuilder()
            .setContent('# Tickets System - Purchase');

        const description = new TextDisplayBuilder()
            .setContent(`Terima kasih sudah membuat ticket.
Silahkan tuliskan kebutuhan kamu dengan jelas agar tim kami bisa membantu lebih cepat!

## 🚫 **Catatan:**
• Mohon gunakan ticket ini sesuai kebutuhan (order, bantuan, atau midman).
• Hindari membuka ticket hanya untuk iseng, karena bisa berakibat blacklist.
• Jika kamu sudah menuliskan detail, harap tunggu respon dari tim kami.

Terima kasih atas pengertian dan kerjasamanya! 🙏`);

        const purchaseInfo = new TextDisplayBuilder()
            .setContent(`**Produk:** ${productName}\n**Metode Pembayaran:** ${paymentMethod}\n**Catatan:** ${notes}`);

        const userInfo = new TextDisplayBuilder()
            .setContent(`**User:** ${interaction.user.tag}\n**Created:** <t:${Math.floor(Date.now() / 1000)}:f>`);

        const sep = new SeparatorBuilder();

        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(title)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(description)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(purchaseInfo)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(userInfo);

        const closeBtn = new ButtonBuilder()
            .setCustomId('ticket_close')
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger);

        const claimBtn = new ButtonBuilder()
            .setCustomId('ticket_claim')
            .setLabel('Claim Ticket')
            .setStyle(ButtonStyle.Primary);

        const addMemberBtn = new ButtonBuilder()
            .setCustomId('ticket_add')
            .setLabel('Add Member')
            .setStyle(ButtonStyle.Secondary);

        const buttonRow = new ActionRowBuilder()
            .addComponents(closeBtn, claimBtn, addMemberBtn);

        const newTicket = await ticketChannel.threads.create({
            name: threadName,
            autoArchiveDuration: 10080,
            reason: `Ticket created by ${interaction.user.tag}`,
            type: ChannelType.PrivateThread,
        });

        await newTicket.members.add(interaction.user.id);
        await newTicket.send({
            components: [container, buttonRow],
            flags: MessageFlags.IsComponentsV2,
        });

        // Send staff notification
        try {
            const staffChannel = await client.channels.fetch(config.notificationChannelId);
            if (staffChannel) {
                const ticketId = `${interaction.guild.name.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
                const userAvatar = interaction.user.displayAvatarURL({ size: 256, dynamic: true });

                const thumbnail = new ThumbnailBuilder({ media: { url: userAvatar } });
                const notifTitle = new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## **🎫 Join Ticket**\n\n**A Purchase Ticket is Opened!**`))
                    .setThumbnailAccessory(thumbnail);

                const basicInfo = new TextDisplayBuilder()
                    .setContent(`• **Ticket ID:** ${ticketId}\n• **Opened by:** <@${interaction.user.id}>\n• **Claimed by:** Not claimed yet`);

                const productDetails = new TextDisplayBuilder()
                    .setContent(`**Product:** ${productName}\n**Payment Method:** ${paymentMethod}\n**Description:** ${notes}`);

                const staffCount = new TextDisplayBuilder()
                    .setContent(`• **Staff in Ticket:** 0\n• **Staff Members:** None`);

                const staffPing = new TextDisplayBuilder()
                    .setContent(`<@&${config.staffRoleId}> - Ticket Baru!`);

                const notifSep = new SeparatorBuilder();

                const notifContainer = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(staffPing)
                    .addSeparatorComponents(notifSep)
                    .addSectionComponents(notifTitle)
                    .addSeparatorComponents(notifSep)
                    .addTextDisplayComponents(basicInfo)
                    .addSeparatorComponents(notifSep)
                    .addTextDisplayComponents(productDetails)
                    .addSeparatorComponents(notifSep)
                    .addTextDisplayComponents(staffCount);

                const joinBtn = new ButtonBuilder()
                    .setCustomId(`ticket_join_${newTicket.id}`)
                    .setLabel('Join Ticket')
                    .setStyle(ButtonStyle.Secondary);

                const notifButtonRow = new ActionRowBuilder().addComponents(joinBtn);

                const notifMessage = await staffChannel.send({
                    components: [notifContainer, notifButtonRow],
                    flags: MessageFlags.IsComponentsV2,
                });

                newTicket.ticketId = ticketId;
                newTicket.notifMessageId = notifMessage.id;
                newTicket.staffMembers = [];
                newTicket.claimedBy = null;
                newTicket.creatorId = interaction.user.id;
                newTicket.productName = productName;
                newTicket.paymentMethod = paymentMethod;
                newTicket.notes = notes;

                logger.info(`[TICKETS] Notifikasi sent to staff channel - Ticket ID: ${ticketId}`);
            }
        } catch (notifErr) {
            console.error('[TICKETS NOTIF ERROR]', notifErr.message);
        }

        const replyTitle = new TextDisplayBuilder().setContent(`## 🎫 **Ticket**`);
        const replyDesc = new TextDisplayBuilder().setContent(`Opened a new ticket: <#${newTicket.id}>`);
        const replySep = new SeparatorBuilder();

        const replyContainer = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(replyTitle)
            .addSeparatorComponents(replySep)
            .addTextDisplayComponents(replyDesc);

        await interaction.editReply({
            components: [replyContainer],
            flags: MessageFlags.IsComponentsV2,
        });

        logger.info(`[TICKETS] ✓ Ticket ready: ${newTicket.name}`);
    } catch (error) {
        console.error('[TICKETS ERROR]', error.message);
        try {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
                );
            
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    components: [errorBlock],
                    flags: MessageFlags.IsComponentsV2,
                });
            } else {
                await interaction.reply({
                    components: [errorBlock],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }
        } catch (replyErr) {
            console.error('[TICKETS REPLY ERROR]', replyErr.message);
        }
    }
}

// ==================== EXPORTS ====================

module.exports = {
    handleTicketPurchaseButton,
    handleTicketHelpButton,
    handleTicketAddButton,
    handlePurchaseFormModal,
    handleMiddlemanRequestButton,
    handleMiddlemanHelpButton,
    handleMiddlemanAddButton,
    handleMiddlemanRequestModal,
};


