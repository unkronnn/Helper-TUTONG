const {
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    SectionBuilder,
    UserSelectMenuBuilder,
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ThumbnailBuilder,
    EmbedBuilder,
} = require('discord.js');
const config = require('../config/config.json');
const fs = require('fs');
const path = require('path');
const logger = require('../console/logger');

// ==================== HELPER FUNCTIONS ====================

// Get time-based greeting (Pagi/Siang/Sore/Malam)
const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Pagi';
    if (hour >= 11 && hour < 15) return 'Siang';
    if (hour >= 15 && hour < 18) return 'Sore';
    return 'Malam';
};

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

// Unified ticket notification builder - consistent format for all ticket types
const createStaffNotification = (type, ticketId, userId, accentColor, threadId, isMiddleman = false, staffMembers = [], claimedBy = null, additionalData = {}) => {
    const userAvatar = additionalData.userAvatar || '';
    
    const typeMap = {
        'help': 'Help',
        'purchase': 'Purchase',
        'middleman': 'Midman'
    };

    const notifSep = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);

    // Title section with avatar - matching the exact format from images
    const notifTitle = new SectionBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Join Ticket`)
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`A new ticket has been opened.\nYou may respond to the ticket if you're available!`)
        );
    
    // Add thumbnail if avatar URL exists and is valid
    if (userAvatar && userAvatar.length > 0 && userAvatar.startsWith('http')) {
        try {
            const thumbnail = new ThumbnailBuilder({ media: { url: userAvatar } });
            notifTitle.setThumbnailAccessory(thumbnail);
        } catch (err) {
            console.warn(`[NOTIFICATION] Failed to create thumbnail: ${err.message}`);
        }
    }

    // Basic ticket details
    const claimedByText = claimedBy ? `<@${claimedBy}>` : 'Not claimed yet';
    const detailsBuilder = new TextDisplayBuilder()
        .setContent(
            `• **Ticket ID:** ${ticketId}\n` +
            `• **Type:** ${typeMap[type] || type}\n` +
            `• **Opened by:** <@${userId}>\n` +
            `• **Claimed by:** ${claimedByText}`
        );

    // Staff count and members list
    let staffMembersList = 'None';
    if (staffMembers && staffMembers.length > 0) {
        staffMembersList = staffMembers.map(id => `<@${id}>`).join(', ');
    }
    const staffCount = new TextDisplayBuilder()
        .setContent(`• **Staff in Ticket:** ${staffMembers?.length || 0}\n• **Staff Members:** ${staffMembersList}`);

    // Build container
    const containerBuilder = new ContainerBuilder()
        .setAccentColor(accentColor)
        .addSectionComponents(notifTitle)
        .addSeparatorComponents(notifSep)
        .addTextDisplayComponents(detailsBuilder)
        .addSeparatorComponents(notifSep);

    // Add type-specific details
    if ((type === 'purchase' || type === 'help') && additionalData.productName && additionalData.paymentMethod) {
        const productDetails = new TextDisplayBuilder()
            .setContent(
                `• **Product:** ${additionalData.productName}\n` +
                `• **Payment Method:** ${additionalData.paymentMethod}\n` +
                `• **Notes:** ${additionalData.notes || '-'}`
            );
        containerBuilder.addTextDisplayComponents(productDetails);
        containerBuilder.addSeparatorComponents(notifSep);
    }

    if (type === 'middleman' && additionalData.buyerSeller && additionalData.range) {
        const middlemanDetails = new TextDisplayBuilder()
            .setContent(
                `• **Buyer/Seller:** ${additionalData.buyerSeller}\n` +
                `• **Range:** ${additionalData.range}`
            );
        containerBuilder.addTextDisplayComponents(middlemanDetails);
        containerBuilder.addSeparatorComponents(notifSep);
    }

    // Add staff section
    containerBuilder.addTextDisplayComponents(staffCount);

    // Create join button
    const joinBtn = new ButtonBuilder()
        .setCustomId(`${isMiddleman ? 'middleman' : 'ticket'}_join_${threadId}`)
        .setLabel('Join Ticket')
        .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(joinBtn);
    containerBuilder.addActionRowComponents(buttonRow);

    return { notifContainer: containerBuilder };
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

        const newTicket = await ticketChannel.threads.create({
            name: threadName,
            autoArchiveDuration: 10080,
            reason: `Ticket created by ${interaction.user.tag}`,
            type: ChannelType.PrivateThread,
        });

        // Send ticket message using template
        let ticketMessage;
        
        // Create buttons
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

        if (type === 'purchase') {
            ticketMessage = createPurchaseTicketMessage(interaction.user, formData, [closeBtn, claimBtn, addMemberBtn]);
        } else if (type === 'help') {
            ticketMessage = createHelpTicketMessage(interaction.user, [closeBtn, claimBtn, addMemberBtn]);
        }

        if (ticketMessage) {
            await newTicket.send({
                components: [ticketMessage],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        await newTicket.members.add(interaction.user.id);

        // Generate ticketId
        const ticketId = `${interaction.guild.name.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Send staff notification
        try {
            const staffChannel = await client.channels.fetch(config.channels.openedTickets);
            if (staffChannel) {
                // Build additional data based on ticket type
                const additionalData = {
                    userAvatar: interaction.user.displayAvatarURL({ size: 256, dynamic: true })
                };

                if ((type === 'purchase' || type === 'help') && formData) {
                    additionalData.productName = formData.productName;
                    additionalData.paymentMethod = formData.paymentMethod;
                    additionalData.notes = formData.notes;
                }

                // Send the notification container with improved format
                const { notifContainer } = createStaffNotification(
                    type,
                    ticketId,
                    interaction.user.id,
                    accentColor,
                    newTicket.id,
                    false,
                    [],
                    null,
                    additionalData
                );

                // Send staff mention message
                const staffMentionMessage = await staffChannel.send(`<@&${config.roles.staff}>`);

                const notifMessage = await staffChannel.send({
                    components: [notifContainer],
                    flags: MessageFlags.IsComponentsV2,
                });

                newTicket.ticketId = ticketId;
                newTicket.staffMentionMessageId = staffMentionMessage.id;
                newTicket.notifMessageId = notifMessage.id;
                newTicket.staffMembers = [];
                newTicket.claimedBy = null;
                newTicket.creatorId = interaction.user.id;

                if ((type === 'purchase' || type === 'help') && formData) {
                    newTicket.productName = formData.productName;
                    newTicket.paymentMethod = formData.paymentMethod;
                    newTicket.notes = formData.notes;
                }

                logger.info(`[TICKET] Staff notif sent - Ticket ID: ${ticketId}`);
            }
        } catch (notifErr) {
            console.error('[TICKET NOTIF ERROR]', notifErr.message);
        }

        // Create ephemeral response with new format
        const titleDisplay = new TextDisplayBuilder()
            .setContent('## HAJI UTONG - Ticket System');
        
        const descDisplay = new TextDisplayBuilder()
            .setContent('Your ticket has been created.\nPlease wait until staff respond to your ticket!');
        
        const viewBtn = new ButtonBuilder()
            .setLabel('View Ticket')
            .setStyle(ButtonStyle.Link)
            .setURL(newTicket.url);
        
        const viewButtonRow = new ActionRowBuilder().addComponents(viewBtn);
        
        const separator = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);
        
        const descSection = new SectionBuilder()
            .addTextDisplayComponents(descDisplay)
            .addActionRowComponents(viewButtonRow);
        
        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(titleDisplay)
            .addSeparatorComponents(separator)
            .addSectionComponents(descSection);

        await interaction.editReply({
            components: [container],
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
    // Defer the interaction immediately
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    
    // Directly create help ticket without form
    await createTicket('help', interaction, client, null);
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

    // Step 1: Show range selection form
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

    const title = new TextDisplayBuilder()
        .setContent(`# HAJI UTONG - Middleman`);
    
    const separator1 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);
    
    const description = new TextDisplayBuilder()
        .setContent(`Silahkan pilih range harga Sesuai dengan Nominal Transaksi kamu!\nJangan sampai salah pilih range transaksi, karena itu akan membuat admin bingung.`);

    const selectRow = new ActionRowBuilder().addComponents(rangeSelect);

    const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16))
        .addTextDisplayComponents(title)
        .addSeparatorComponents(separator1)
        .addTextDisplayComponents(description)
        .addActionRowComponents(selectRow);

    try {
        await interaction.reply({
            components: [container],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    } catch (replyErr) {
        console.warn(`[MIDDLEMAN REQUEST] Failed to reply: ${replyErr.message}`);
    }
}

// ==================== MIDDLEMAN MODAL HANDLER ====================

async function handleMiddlemanRequestModal(interaction, client) {
    const lockKey = `${interaction.user.id}_middleman`;
    const lockValue = Date.now(); // Unique value untuk setiap attempt
    
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (deferErr) {
        console.warn(`[MIDDLEMAN MODAL] Failed to defer: ${deferErr.message}`);
        return;
    }

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

        const newRequest = await middlemanChannel.threads.create({
            name: threadName,
            autoArchiveDuration: 10080,
            reason: `Middleman request created by ${interaction.user.tag}`,
            type: ChannelType.PrivateThread,
        });

        // Create buttons for middleman ticket
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

        // Send middleman ticket message using template
        const { embed1, embed2, embed3 } = createMiddlemanTicketMessage(interaction.user, {
            rangeTransaction: rangeMap[rangeInput.trim()],
            fee: '(akan dihitung)', // Will be calculated
            taggedUsers: [interaction.user] // Start with creator
        }, [closeBtn, claimBtn, addMemberBtn]);

        if (embed1 && embed2 && embed3) {
            try {
                // Send embed 1
                await newRequest.send({
                    components: [embed1],
                    flags: MessageFlags.IsComponentsV2,
                });
            } catch (embedErr) {
                console.warn('[MIDDLEMAN EMBED1 ERROR]', embedErr.message);
            }
            
            try {
                // Send embed 2
                await newRequest.send({
                    components: [embed2],
                    flags: MessageFlags.IsComponentsV2,
                });
            } catch (embedErr) {
                console.warn('[MIDDLEMAN EMBED2 ERROR]', embedErr.message);
            }
            
            try {
                // Send embed 3 with buttons
                await newRequest.send({
                    components: [embed3],
                    flags: MessageFlags.IsComponentsV2,
                });
            } catch (embedErr) {
                console.warn('[MIDDLEMAN EMBED3 ERROR]', embedErr.message);
            }
        }

        await newRequest.members.add(interaction.user.id);

        // Generate requestId
        const requestId = `MID-${interaction.guild.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Send staff notification
        try {
            const staffChannel = await client.channels.fetch(config.channels.openedTickets);
            if (staffChannel) {
                const additionalData = {
                    userAvatar: interaction.user.displayAvatarURL({ size: 256, dynamic: true }),
                    buyerSeller: `-`,
                    range: rangeMap[rangeInput.trim()]
                };

                const { notifContainer } = createStaffNotification(
                    'middleman',
                    requestId,
                    interaction.user.id,
                    accentColor,
                    newRequest.id,
                    true,
                    [],
                    null,
                    additionalData
                );

                // Send staff mention message
                const staffMentionMessage = await staffChannel.send(`<@&${config.roles.staff}>`);

                // Send notification without legacy content field (staff mention is now in the component)
                const notifMessage = await staffChannel.send({
                    components: [notifContainer],
                    flags: MessageFlags.IsComponentsV2,
                });

                newRequest.requestId = requestId;
                newRequest.staffMentionMessageId = staffMentionMessage.id;
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
        try {
            const ephemeralTitle = new TextDisplayBuilder().setContent(`## HAJI UTONG - Ticket System`);
            const ephemeralDesc = new TextDisplayBuilder().setContent(`✅ Your ticket has been opened!\n\n[Click here to see your ticket](${newRequest.url})`);
            
            const ephemeralContainer = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addTextDisplayComponents(ephemeralTitle)
                .addTextDisplayComponents(ephemeralDesc);

            await interaction.editReply({
                components: [ephemeralContainer],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        } catch (ephemeralErr) {
            console.error('[MIDDLEMAN EPHEMERAL ERROR]', ephemeralErr);
            // Try fallback reply
            try {
                const fallbackContainer = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`✅ Your ticket has been opened!`)
                    );
                
                await interaction.editReply({
                    components: [fallbackContainer],
                    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                });
            } catch (fallbackErr) {
                console.error('[MIDDLEMAN FALLBACK ERROR]', fallbackErr.message);
            }
        }

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

// ==================== MODAL HANDLERS ====================

async function handleHelpFormModal(interaction, client) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (deferErr) {
        console.warn(`[HELP MODAL] Failed to defer: ${deferErr.message}`);
        return;
    }

    try {
        const productName = interaction.fields.getTextInputValue('help_product');
        const paymentMethod = interaction.fields.getTextInputValue('help_method');
        const notes = interaction.fields.getTextInputValue('help_notes') || '-';

        // Create help ticket with form data
        const formData = { productName, paymentMethod, notes };
        await createTicket('help', interaction, client, formData);
    } catch (error) {
        console.error('[HELP ERROR]', error.message);
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
            console.error('[HELP REPLY ERROR]', replyErr.message);
        }
    }
}

async function handlePurchaseFormModal(interaction, client) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (deferErr) {
        console.warn(`[PURCHASE MODAL] Failed to defer: ${deferErr.message}`);
        return;
    }

    try {
        const productName = interaction.fields.getTextInputValue('purchase_product');
        const paymentMethod = interaction.fields.getTextInputValue('purchase_method');
        const notes = interaction.fields.getTextInputValue('purchase_notes') || '-';
        const accentColor = parseInt(config.primaryColor, 16);

        // Get payment details
        const paymentDetails = getPaymentDetails(paymentMethod);

        if (!paymentDetails) {
            // Payment method not available - still create ticket
            console.warn(`[PURCHASE] Payment method "${paymentMethod}" not found in config, creating ticket anyway`);
        }

        // Create purchase ticket regardless of payment method availability
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

// ==================== TICKET MESSAGE TEMPLATES ====================

function createPurchaseTicketMessage(user, formData = {}, buttons = []) {
    const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16));

    // Header section
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# HAJI UTONG - Purchase Ticket`)
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Hello, ${user}\nPlease wait until a staff member arrives at your ticket!`)
    );

    // Separator before NOTES
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2));

    // Notes section
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## NOTES:`)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `• Please use this ticket as needed\n` +
            `• Avoid opening tickets just for fun, as this may result in being **blacklisted**\n` +
            `• If you have already provided details, please wait for a response from our team.`
        )
    );

    // Thank you message
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Thank you for your understanding and cooperation! 🙏`)
    );

    // Separator before footer
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2));

    // Footer info
    const productDisplay = formData.productName || '[To be filled]';
    const paymentDisplay = formData.paymentMethod || '[To be filled]';
    const notesDisplay = formData.notes || '[To be filled]';
    
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**Product:** ${productDisplay}\n` +
            `**Payment Method:** ${paymentDisplay}\n` +
            `**Notes:** ${notesDisplay}`
        )
    );

    // Separator before buttons
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2));

    // Add buttons if provided
    if (buttons && buttons.length > 0) {
        const buttonRow = new ActionRowBuilder().addComponents(...buttons);
        container.addActionRowComponents(buttonRow);
    }

    return container;
}

function createHelpTicketMessage(user, buttons = []) {
    const container = new ContainerBuilder()
        .setAccentColor(0x1A472A);

    // Header section
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# HAJI UTONG - Help Ticket`)
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Hello, ${user}\nPlease wait until a staff member arrives at your ticket!`)
    );

    // Separator before NOTES
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2));

    // Notes section
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## NOTES:`)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `• Please use this ticket as needed\n` +
            `• Avoid opening tickets just for fun, as this may result in being **blacklisted**\n` +
            `• If you have already provided details, please wait for a response from our team.`
        )
    );

    // Thank you message
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Thank you for your understanding and cooperation! 🙏`)
    );

    // Separator before buttons
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(2));

    // Add buttons if provided
    if (buttons && buttons.length > 0) {
        const buttonRow = new ActionRowBuilder().addComponents(...buttons);
        container.addActionRowComponents(buttonRow);
    }

    return container;
}

function createMiddlemanTicketMessage(user, ticketData = {}, buttons = []) {
    const accentColor = parseInt(config.primaryColor, 16);
    
    // ===== EMBED 1: Header with greeting and transaction details =====
    const embed1 = new ContainerBuilder()
        .setAccentColor(accentColor);

    embed1.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# HAJI UTONG - Middleman`)
    );

    const timeGreeting = getTimeGreeting();
    const taggedUsersMentions = (ticketData.taggedUsers || [user])
        .map(u => `<@${u.id}>`)
        .join(' dan ');
    
    embed1.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Selamat ${timeGreeting}, ${taggedUsersMentions}`)
    );

    // Separator 1
    embed1.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large));

    embed1.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Detail Transaksi**`)
    );

    embed1.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `• Range Transaksi: Rp. ${ticketData.rangeTransaction || '[Not specified]'}\n` +
            `• Fee Rekber: Rp. ${ticketData.fee || '[Not specified]'}`
        )
    );

    // Separator 2
    embed1.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large));

    embed1.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Harap tunggu sampai staff masuk ke dalam ticketmu!`)
    );

    // ===== EMBED 2: Form =====
    const embed2 = new ContainerBuilder()
        .setAccentColor(accentColor);

    embed2.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## Middleman Form`)
    );

    embed2.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Silahkan isi form dibawah ini:`)
    );

    // Separator 3
    embed2.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large));

    embed2.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `\`\`\`\nPenjual:\nPembeli:\nJenis Barang yang Dijual:\nHarga Barang yang Dijual: Rp.\nInc/Ex:\nReffull/Noreff:\n\`\`\``
        )
    );

    // Separator 4
    embed2.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large));

    embed2.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## Catatan:`)
    );

    embed2.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `- Inc = Harga sudah termasuk biaya middleman\n` +
            `- Ex = Harga belum termasuk biaya middleman`
        )
    );

    // ===== EMBED 3: Buttons =====
    const embed3 = new ContainerBuilder()
        .setAccentColor(accentColor);

    if (buttons && buttons.length > 0) {
        const buttonRow = new ActionRowBuilder().addComponents(...buttons);
        embed3.addActionRowComponents(buttonRow);
    }

    return { embed1, embed2, embed3 };
}

// ==================== EXPORTS ====================

module.exports = {
    handleTicketPurchaseButton,
    handleTicketHelpButton,
    handleTicketAddButton,
    handleHelpFormModal,
    handlePurchaseFormModal,
    handleMiddlemanRequestButton,
    handleMiddlemanAddButton,
    handleMiddlemanRequestModal,
    createTicket,
    createPurchaseTicketMessage,
    createHelpTicketMessage,
    createMiddlemanTicketMessage,
    createStaffNotification,
};
