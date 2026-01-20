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

// Simple lock mechanism - prevent concurrent ticket creation per user
const ticketCreationLocks = new Map(); // userId -> timestamp

// Format number to Indonesian Rupiah format (e.g., 2000000 -> 2.000.000)
const formatRupiah = (num) => {
    if (typeof num === 'string') {
        num = parseInt(num.replace(/\D/g, '')) || 0;
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

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
        const ticketChannel = await client.channels.fetch(config.channels.tickets);
        if (!ticketChannel) {
            logger.warn('[TICKET COUNT] Channel not found');
            return 0;
        }
        
        const threads = await ticketChannel.threads.fetch({ archived: false });
        let userTicketCount = 0;
        
        logger.debug(`[TICKET COUNT] Checking threads for user ${userId}`);
        for (const thread of threads.threads.values()) {
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

const checkStoreStatus = (type = 'ticket') => {
    const status = getStatus();
    logger.debug(`[TICKET] Status check: isOpen=${status.isOpen}`);
    
    if (status.isOpen === false) {
        logger.debug(`[TICKET] Store closed - cannot open ${type}`);
        const errorBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`❌ Toko sedang tutup! Tidak bisa membuka ${type} sekarang.`)
            );
        return { isOpen: false, errorBlock };
    }
    return { isOpen: true };
};

const createStaffNotification = (type, ticketId, interaction, accentColor, detailsBuilder, threadId, isMiddleman = false) => {
    const userAvatar = interaction.user.displayAvatarURL({ size: 256, dynamic: true });
    
    const typeMap = {
        'help': 'A Help Ticket is Opened!',
        'purchase': 'A Purchase Ticket is Opened!',
        'middleman': 'A Middleman Ticket is Opened!'
    };

    const thumbnail = new ThumbnailBuilder({ media: { url: userAvatar } });
    const notifTitle = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## **🎫 Join Ticket**\n\n**${typeMap[type]}**`))
        .setThumbnailAccessory(thumbnail);

    const staffPing = new TextDisplayBuilder()
        .setContent(`<@&${config.roles.staff}> - Ticket Baru!`);

    const staffCount = new TextDisplayBuilder()
        .setContent(`• **Staff in ${isMiddleman ? 'Request' : 'Ticket'}:** 0\n• **Staff Members:** None`);

    const notifSep = new SeparatorBuilder();

    const notifContainer = new ContainerBuilder()
        .setAccentColor(accentColor)
        .addTextDisplayComponents(staffPing)
        .addSeparatorComponents(notifSep)
        .addSectionComponents(notifTitle)
        .addSeparatorComponents(notifSep)
        .addTextDisplayComponents(detailsBuilder)
        .addSeparatorComponents(notifSep)
        .addTextDisplayComponents(staffCount);

    const joinBtn = new ButtonBuilder()
        .setCustomId(`${isMiddleman ? 'middleman' : 'ticket'}_join_${threadId}`)
        .setLabel(`Join ${isMiddleman ? 'Request' : 'Ticket'}`)
        .setStyle(ButtonStyle.Secondary);

    const notifButtonRow = new ActionRowBuilder().addComponents(joinBtn);

    return { notifContainer, notifButtonRow };
};

// Create ticket helper for Help and Purchase types
const createTicket = async (type, interaction, client, formData = null) => {
    const userId = interaction.user.id;
    
    try {
        // Check if user already creating a ticket
        if (ticketCreationLocks.has(userId)) {
            logger.warn(`[TICKET] ⛔ BLOCKED - ${interaction.user.tag} already creating ticket`);
            return;
        }
        
        // Lock user
        ticketCreationLocks.set(userId, Date.now());
        
        // Auto-unlock after 25 seconds
        setTimeout(() => ticketCreationLocks.delete(userId), 25000);
        
        try {
            // Check status
            const statusCheck = checkStoreStatus(`${type} ticket`);
        if (!statusCheck.isOpen) {
            logger.debug(`[TICKET] User ${interaction.user.tag} blocked - toko tutup`);
            return await interaction.editReply({
                components: [statusCheck.errorBlock],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        // Check ticket count
        const ticketCount = await checkUserTicketCount(interaction.user.id, client);
        logger.debug(`[TICKET] User ${interaction.user.tag} has ${ticketCount} ticket(s)`);
        if (ticketCount >= 1) {
            logger.debug(`[TICKET] User ${interaction.user.tag} blocked - sudah punya ticket`);
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ You\'re only allowed to have 1 active ticket at a time.')
                );
            return await interaction.editReply({
                components: [errorBlock],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const ticketChannel = await client.channels.fetch(config.channels.tickets);

        if (!ticketChannel) {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Ticket channel not found!')
                );
            return await interaction.editReply({
                components: [errorBlock],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const threadPrefix = type === 'purchase' ? 'purchase' : 'help';
        const threadName = `${threadPrefix}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const accentColor = parseInt(config.primaryColor, 16);

        const title = new TextDisplayBuilder()
            .setContent(`# Tickets System - ${type.charAt(0).toUpperCase() + type.slice(1)}`);

        const description = new TextDisplayBuilder()
            .setContent(`Terima kasih sudah membuat ticket.
Silahkan tuliskan kebutuhan kamu dengan jelas agar tim kami bisa membantu lebih cepat!

## 🚫 **Catatan:**
• Mohon gunakan ticket ini sesuai kebutuhan.
• Hindari membuka ticket hanya untuk iseng, karena bisa berakibat blacklist.
• Jika kamu sudah menuliskan detail, harap tunggu respon dari tim kami.

Terima kasih atas pengertian dan kerjasamanya! 🙏`);

        const userInfo = new TextDisplayBuilder()
            .setContent(`**User:** ${interaction.user.tag}\n**Created:** <t:${Math.floor(Date.now() / 1000)}:f>`);

        let infoSection = null;
        if (type === 'purchase' && formData) {
            infoSection = new TextDisplayBuilder()
                .setContent(`**Produk:** ${formData.productName}\n**Metode Pembayaran:** ${formData.paymentMethod}\n**Catatan:** ${formData.notes}`);
        }

        const sep = new SeparatorBuilder();

        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(title)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(description)
            .addSeparatorComponents(sep);

        if (infoSection) {
            container
                .addTextDisplayComponents(infoSection)
                .addSeparatorComponents(sep);
        }

        container
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

        // Generate ticketId
        const ticketId = `${interaction.guild.name.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Send staff notification
        try {
            const staffChannel = await client.channels.fetch(config.channels.openedTickets);
            if (staffChannel) {
                let staffDetailsContent = `• **Ticket ID:** ${ticketId}\n• **Type:** ${type.charAt(0).toUpperCase() + type.slice(1)}\n• **Opened by:** <@${interaction.user.id}>\n• **Claimed by:** Not claimed yet`;
                
                if (type === 'purchase' && formData) {
                    staffDetailsContent += `\n\n**Product:** ${formData.productName}\n**Payment Method:** ${formData.paymentMethod}\n**Description:** ${formData.notes}`;
                }

                const ticketDetails = new TextDisplayBuilder().setContent(staffDetailsContent);

                const { notifContainer, notifButtonRow } = createStaffNotification(type, ticketId, interaction, accentColor, ticketDetails, newTicket.id, false);

                const notifMessage = await staffChannel.send({
                    components: [notifContainer, notifButtonRow],
                    flags: MessageFlags.IsComponentsV2,
                });

                newTicket.ticketId = ticketId;
                newTicket.notifMessageId = notifMessage.id;
                newTicket.staffMembers = [];
                newTicket.claimedBy = null;
                newTicket.creatorId = interaction.user.id;

                if (type === 'purchase' && formData) {
                    newTicket.productName = formData.productName;
                    newTicket.paymentMethod = formData.paymentMethod;
                    newTicket.notes = formData.notes;
                }

                logger.info(`[TICKET] Staff notif sent - Ticket ID: ${ticketId}`);
            }
        } catch (notifErr) {
            console.error('[TICKET NOTIF ERROR]', notifErr.message);
        }

        // Create ephemeral response dengan format seperti screenshot
        const ticketTypeDisplay = type === 'purchase' ? '🎫 Ticket' : '❓ Ticket';
        const ephemeralTitle = new TextDisplayBuilder().setContent(`${ticketTypeDisplay}`);
        const ephemeralDesc = new TextDisplayBuilder().setContent(`Opened a new ticket: <#${newTicket.id}>`);
        
        const viewBtn = new ButtonBuilder()
            .setLabel('View Ticket')
            .setStyle(ButtonStyle.Link)
            .setURL(newTicket.url);
        
        const viewButtonRow = new ActionRowBuilder().addComponents(viewBtn);
        
        const ephemeralContainer = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(ephemeralTitle)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(ephemeralDesc);

        await interaction.editReply({
            components: [ephemeralContainer, viewButtonRow],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });

        logger.info(`[TICKET] ✓ ${type.toUpperCase()} ticket ready: ${newTicket.name}`);
        } finally {
            // Auto-unlock is handled by setTimeout above
            logger.debug(`[TICKET] Ticket creation completed for ${userId}`);
        }
    } catch (error) {
        console.error('[TICKET ERROR]', error.message);
        // Auto-unlock is handled by setTimeout, no manual cleanup needed
        try {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
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
            console.error('[TICKET REPLY ERROR]', replyErr.message);
        }
    }
};

// ==================== TICKET BUTTON HANDLERS ====================

async function handleTicketPurchaseButton(interaction, client) {
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
    await createTicket('help', interaction, client);
}

async function handleTicketAddButton(interaction, client) {
    const userSelect = new UserSelectMenuBuilder()
        .setCustomId('ticket_add_user')
        .setPlaceholder('Select a user');

    const selectRow = new ActionRowBuilder().addComponents(userSelect);

    const titleBlock = new TextDisplayBuilder()
        .setContent('👥 **Pilih user untuk ditambahkan ke ticket:**');

    const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16))
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
        .setContent('👥 **Choose buyer/seller to add to the ticket:**');

    const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16))
        .addTextDisplayComponents(titleBlock);

    await interaction.reply({
        components: [container, selectRow],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
}

// ==================== MIDDLEMAN BUTTON HANDLERS ====================

async function handleMiddlemanRequestButton(interaction, client) {
    // Check if store is open
    const statusCheck = checkStoreStatus('middleman request');
    if (!statusCheck.isOpen) {
        logger.debug(`[TICKET] User ${interaction.user.tag} blocked - toko tutup (middleman request)`);
        return await interaction.reply({
            components: [statusCheck.errorBlock],
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
        .setAccentColor(parseInt(config.primaryColor, 16))
        .addTextDisplayComponents(titleBlock);

    await interaction.reply({
        components: [container, selectRow],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
}

// ==================== MIDDLEMAN MODAL HANDLER ====================

async function handleMiddlemanRequestModal(interaction, client) {
    const lockKey = `${interaction.user.id}_middleman`;
    const lockValue = Date.now(); // Unique value untuk setiap attempt
    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        // ATOMIC check-and-set
        if (ticketCreationLocks.has(lockKey)) {
            const existingTime = ticketCreationLocks.get(lockKey);
            logger.warn(`[MIDDLEMAN] ⛔ BLOCKED - Concurrent creation for ${interaction.user.tag}. Existing lock: ${existingTime}, New attempt: ${lockValue}`);
            return;
        }
        
        // ATOMIC SET
        ticketCreationLocks.set(lockKey, lockValue);
        logger.debug(`[MIDDLEMAN] ✓ LOCK ACQUIRED for ${lockKey} (value: ${lockValue})`);
        
        // Auto-cleanup after 20 seconds
        setTimeout(() => {
            const currentValue = ticketCreationLocks.get(lockKey);
            if (currentValue === lockValue) {
                ticketCreationLocks.delete(lockKey);
                logger.debug(`[MIDDLEMAN] Lock auto-expired for ${lockKey}`);
            }
        }, 20000);
        
        try {
            const middlemanChannel = await client.channels.fetch(config.channels.middleman);

            if (!middlemanChannel) {
                const errorBlock = new ContainerBuilder()
                    .setAccentColor(parseInt(config.primaryColor, 16))
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
                .setAccentColor(parseInt(config.primaryColor, 16))
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
        const accentColor = parseInt(config.primaryColor, 16);

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
            // Message 1: Header
            await newRequest.send({
                content: `## 📋 **Form Middleman**\n\nSilahkan isi form di bawah ini:`
            });

            // Message 2: Form (easy to copy for mobile)
            await newRequest.send({
                content: `\`\`\`
Penjual : 
Pembeli : 
Jenis Barang yang Dijual : 
Harga Barang yang Dijual : Rp. (contoh: Rp. 2.000.000)
Inc/Ex :
\`\`\``
            });

            // Message 3: Catatan
            await newRequest.send({
                content: `**Catatan:**
• Inc = Harga sudah termasuk biaya middleman
• Ex = Harga belum termasuk biaya middleman`
            });
            logger.info('[FORM] ✓ Form sent successfully to modal thread');
        } catch (formErr) {
            console.error('[FORM ERROR - MODAL]', formErr);
        }

        await newRequest.members.add(interaction.user.id);

        // Generate requestId
        const requestId = `MID-${interaction.guild.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Send staff notification
        try {
            const staffChannel = await client.channels.fetch(config.channels.openedTickets);
            if (staffChannel) {
                const requestDetails = new TextDisplayBuilder()
                    .setContent(`• **Ticket ID:** ${requestId}\n• **Type:** Transaction\n• **Opened by:** <@${interaction.user.id}>\n• **Claimed by:** Not claimed yet\n• **Range:** ${rangeMap[rangeInput.trim()]}`);

                const { notifContainer, notifButtonRow } = createStaffNotification('middleman', requestId, interaction, accentColor, requestDetails, newRequest.id, true);

                const notifMessage = await staffChannel.send({
                    content: `<@&${config.roles.staff}>`,
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

        // Create ephemeral response dengan format seperti screenshot
        const ephemeralTitle = new TextDisplayBuilder().setContent(`## Voxteria - Ticket System`);
        const ephemeralDesc = new TextDisplayBuilder().setContent(`✅ Your ticket has been opened!\n\n[Click here to see your ticket](${newRequest.url})`);
        
        const ephemeralContainer = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(ephemeralTitle)
            .addTextDisplayComponents(ephemeralDesc);

        await interaction.editReply({
            components: [ephemeralContainer],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });

        logger.info(`[MIDDLEMAN] ✓ Request ready: ${newRequest.name}`);
        } finally {
            // Clean up lock (only if ours)
            const currentValue = ticketCreationLocks.get(lockKey);
            if (currentValue === lockValue) {
                ticketCreationLocks.delete(lockKey);
                logger.debug(`[MIDDLEMAN] Lock released for ${lockKey}`);
            }
        }
    } catch (error) {
        console.error('[MIDDLEMAN ERROR]', error.message);
        // Cleanup on error
        const currentValue = ticketCreationLocks.get(lockKey);
        if (currentValue === lockValue) {
            ticketCreationLocks.delete(lockKey);
        }
        try {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
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

// Get payment details by method
const getPaymentDetails = (method) => {
    const paymentsFile = path.join(__dirname, '../config/payments.json');
    try {
        const payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
        const methodLowercase = method.toLowerCase().trim();
        
        // Check lokal methods
        if (methodLowercase === 'bank jago' || methodLowercase === 'jago') {
            return { type: 'bank', name: 'Bank Jago', norek: payments.lokal?.jago?.norek };
        }
        if (methodLowercase === 'seabank') {
            return { type: 'bank', name: 'Seabank', norek: payments.lokal?.seabank?.norek };
        }
        if (methodLowercase === 'bca') {
            return { type: 'bank', name: 'BCA', norek: payments.lokal?.bca?.norek };
        }
        if (methodLowercase === 'qris') {
            return { type: 'qris', name: 'QRIS', imageUrl: payments.lokal?.qris?.imageUrl };
        }
        
        // Check international methods
        if (methodLowercase === 'paypal') {
            return { type: 'email', name: 'PayPal', email: payments.internasional?.paypal?.email };
        }
        if (methodLowercase === 'bitcoin' || methodLowercase === 'btc') {
            return { type: 'wallet', name: 'Bitcoin', wallet: payments.internasional?.crypto?.btc };
        }
        if (methodLowercase === 'ethereum' || methodLowercase === 'eth') {
            return { type: 'wallet', name: 'Ethereum', wallet: payments.internasional?.crypto?.ethereum_erc20 };
        }
        if (methodLowercase === 'usdt') {
            return { type: 'wallet', name: 'USDT (ERC20)', wallet: payments.internasional?.crypto?.usdt_erc20 };
        }
        if (methodLowercase === 'binance') {
            return { type: 'binance', name: 'Binance', id: payments.internasional?.binance?.id, qrUrl: payments.internasional?.binance?.qrUrl };
        }
        
        return null;
    } catch (err) {
        console.error('[PAYMENT DETAILS ERROR]', err.message);
        return null;
    }
};

// Get QRIS details
const getQrisDetails = () => {
    const paymentsFile = path.join(__dirname, '../config/payments.json');
    try {
        const payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
        return payments.lokal?.qris;
    } catch (err) {
        console.error('[QRIS ERROR]', err.message);
        return null;
    }
};

async function handlePurchaseFormModal(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const productName = interaction.fields.getTextInputValue('purchase_product');
        const paymentMethod = interaction.fields.getTextInputValue('purchase_method');
        const notes = interaction.fields.getTextInputValue('purchase_notes') || '-';
        const accentColor = parseInt(config.primaryColor, 16);

        // Get payment details
        const paymentDetails = getPaymentDetails(paymentMethod);

        if (!paymentDetails) {
            // Payment method not available - show QRIS only
            const qris = getQrisDetails();

            const warningText = new TextDisplayBuilder()
                .setContent(`❌ **${paymentMethod}** sedang tidak tersedia.\n\nGunakan **QRIS** untuk pembayaran:`);

            const qrisSection = new TextDisplayBuilder()
                .setContent(`Scan QR Code di bawah untuk melakukan pembayaran.`);

            const container = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addTextDisplayComponents(warningText)
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(qrisSection);

            // Add QRIS image if available
            if (qris?.imageUrl) {
                const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require('@discordjs/builders');
                const mediaGallery = new MediaGalleryBuilder()
                    .addItems(new MediaGalleryItemBuilder().setURL(qris.imageUrl));
                container.addMediaGalleryComponents(mediaGallery);
            }

            return await interaction.editReply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        // Payment method is available - create purchase ticket
        const formData = { productName, paymentMethod, notes };
        await createTicket('purchase', interaction, client, formData);
    } catch (error) {
        console.error('[PURCHASE ERROR]', error.message);
        try {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
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
            console.error('[PURCHASE REPLY ERROR]', replyErr.message);
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
    handleMiddlemanAddButton,
    handleMiddlemanRequestModal,
};
