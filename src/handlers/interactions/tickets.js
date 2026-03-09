const { MessageFlags, TextDisplayBuilder, ContainerBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits, SeparatorBuilder, SeparatorSpacingSize, SectionBuilder, ThumbnailBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config.json');
const {
    handleTicketPurchaseButton,
    handleTicketHelpButton,
    handleTicketAddButton,
    handleMiddlemanRequestButton,
    handleMiddlemanAddButton,
    createMiddlemanTicketMessage,
    createStaffNotification,
} = require('../ticketHandler');

async function handleTicketInteractions(client, interaction) {
    try {
        // Handle review submit button
        if (interaction.customId === 'review_submit') {
            return await handleReviewButton(interaction);
        }

        // Handle ticket buttons
        if (interaction.customId === 'ticket_purchase') {
            return await handleTicketPurchaseButton(interaction, client);
        } else if (interaction.customId === 'ticket_help') {
            return await handleTicketHelpButton(interaction, client);
        } else if (interaction.customId === 'ticket_add') {
            return await handleTicketAddButton(interaction, client);
        } else if (interaction.customId === 'ticket_claim') {
            return await handleTicketClaim(interaction, client);
        } else if (interaction.customId === 'ticket_close') {
            return await handleTicketClose(interaction);
        }

        // Handle middleman buttons
        if (interaction.customId === 'middleman_request') {
            return await handleMiddlemanRequestButton(interaction, client);
        } else if (interaction.customId === 'middleman_add') {
            return await handleMiddlemanAddButton(interaction, client);
        } else if (interaction.customId === 'middleman_claim') {
            return await handleMiddlemanClaim(interaction, client);
        } else if (interaction.customId === 'middleman_close') {
            return await handleMiddlemanClose(interaction);
        } else if (interaction.customId === 'middleman_form_buyer') {
            return await handleMiddlemanFormBuyer(interaction);
        } else if (interaction.customId === 'middleman_form_seller') {
            return await handleMiddlemanFormSeller(interaction);
        }

        // Handle ticket join button
        if (interaction.customId.startsWith('ticket_join_')) {
            return await handleTicketJoin(interaction, client);
        }

        // Handle middleman join button
        if (interaction.customId.startsWith('middleman_join_')) {
            return await handleMiddlemanJoin(interaction, client);
        }

        // Handle middleman user select (range selection)
        if (interaction.customId.startsWith('middleman_user_select_')) {
            return await handleMiddlemanUserSelect(interaction, client);
        }



        // Handle user select menus (add member)
        if (interaction.customId === 'ticket_add_user') {
            return await handleTicketAddUser(interaction);
        } else if (interaction.customId === 'middleman_add_user') {
            return await handleMiddlemanAddUser(interaction);
        }

    } catch (error) {
        console.error('[TICKET INTERACTION ERROR]', error);
        await replyWithError(interaction, error.message);
    }
}

async function handleReviewButton(interaction) {
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

    const reviewModal = new ModalBuilder()
        .setCustomId('review_form_modal')
        .setTitle('Submit Your Review');

    const reviewInput = new TextInputBuilder()
        .setCustomId('review_text')
        .setLabel('Your Review')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const ratingInput = new TextInputBuilder()
        .setCustomId('review_rating')
        .setLabel('Rating (1-5)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('5')
        .setRequired(true);

    const row1 = new ActionRowBuilder().addComponents(reviewInput);
    const row2 = new ActionRowBuilder().addComponents(ratingInput);

    reviewModal.addComponents(row1, row2);
    return await interaction.showModal(reviewModal);
}

async function handleTicketClaim(interaction, client) {
    // Check if user has staff role
    if (!interaction.member.roles.cache.has(config.roles.staff)) {
        const errorBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('❌ Only staff can claim tickets!')
            );
        return await interaction.reply({
            components: [errorBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    }

    const thread = interaction.channel;
    
    // Track claimed by
    if (thread && thread.isThread()) {
        thread.claimedBy = interaction.user.id;

        // Add to staffMembers list if not already there
        if (!thread.staffMembers) {
            thread.staffMembers = [];
        }
        if (!thread.staffMembers.includes(interaction.user.id)) {
            thread.staffMembers.push(interaction.user.id);
        }

        // Update notification di staff channel
        try {
            const staffChannel = await client.channels.fetch(config.channels.openedTickets);
            if (staffChannel && thread.notifMessageId) {
                const notifMessage = await staffChannel.messages.fetch(thread.notifMessageId).catch(() => null);
                
                if (notifMessage) {
                    // Get creator user for avatar
                    const creatorId = thread.creatorId;
                    const creatorUser = await interaction.guild.members.fetch(creatorId).catch(() => null);
                    const userAvatar = creatorUser?.user.displayAvatarURL({ size: 256, dynamic: true });
                    
                    // Determine ticket type from thread name
                    const ticketType = thread.name?.split('-')[0] || 'help';
                    
                    // Build additional data
                    const additionalData = {
                        userAvatar: userAvatar || ''
                    };

                    // Add product details if this is a purchase or help ticket
                    if ((ticketType === 'purchase' || ticketType === 'help') && thread.productName && thread.paymentMethod) {
                        additionalData.productName = thread.productName;
                        additionalData.paymentMethod = thread.paymentMethod;
                        additionalData.notes = thread.notes || '-';
                    }

                    // Add middleman details if applicable
                    if (ticketType === 'midman' && thread.range) {
                        additionalData.buyerSeller = '-';
                        additionalData.range = thread.range;
                    }

                    // Rebuild notification using createStaffNotification
                    const { notifContainer } = createStaffNotification(
                        ticketType,
                        thread.ticketId || 'N/A',
                        creatorId || 'Unknown',
                        parseInt(config.primaryColor, 16),
                        thread.id,
                        ticketType === 'midman',
                        thread.staffMembers || [],
                        thread.claimedBy || null,
                        additionalData
                    );

                    await notifMessage.edit({ components: [notifContainer] }).catch(err => {
                        console.error('[EDIT NOTIF ERROR CLAIM]', err.message);
                    });
                }
            }
        } catch (updateErr) {
            console.error('[UPDATE NOTIF ERROR CLAIM]', updateErr.message);
        }
    }

    const successBlock = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16))
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`✅ ${interaction.user} has claimed this ticket!`)
        );
    await interaction.reply({
        components: [successBlock],
        flags: MessageFlags.IsComponentsV2,
    });
}

async function handleTicketClose(interaction) {
    // Check if user has staff role
    if (!interaction.member.roles.cache.has(config.roles.staff)) {
        const errorBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('❌ Only staff can close tickets!')
            );
        return await interaction.reply({
            components: [errorBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    }

    const modal = new ModalBuilder()
        .setCustomId('close_ticket_modal')
        .setTitle('Close Confirmation');

    const reasonInput = new TextInputBuilder()
        .setCustomId('close_reason')
        .setLabel('Reason for closing (optional)')
        .setPlaceholder('Masukkan alasan menutup ticket ini...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

    const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

async function handleMiddlemanClaim(interaction, client) {
    // Check if user has staff role
    if (!interaction.member.roles.cache.has(config.roles.staff)) {
        const errorBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('❌ Only staff can claim tickets!')
            );
        return await interaction.reply({
            components: [errorBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    }

    const request = interaction.channel;
    
    // Track claimed by
    if (request && request.isThread()) {
        request.claimedBy = interaction.user.id;

        // Add to staffMembers list if not already there
        if (!request.staffMembers) {
            request.staffMembers = [];
        }
        if (!request.staffMembers.includes(interaction.user.id)) {
            request.staffMembers.push(interaction.user.id);
        }

        // Update notification di staff channel
        try {
            const staffChannel = await client.channels.fetch(config.channels.openedTickets);
            if (staffChannel && request.notifMessageId) {
                const notifMessage = await staffChannel.messages.fetch(request.notifMessageId).catch(() => null);
                
                if (notifMessage) {
                    // Get creator user for avatar
                    const creatorId = request.creatorId;
                    const creatorUser = await interaction.guild.members.fetch(creatorId).catch(() => null);
                    const userAvatar = creatorUser?.user.displayAvatarURL({ size: 256, dynamic: true });
                    
                    // Build additional data for middleman
                    const additionalData = {
                        userAvatar: userAvatar || '',
                        buyerSeller: '-',
                        range: request.range || 'Unknown'
                    };

                    // Rebuild notification using createStaffNotification
                    const { notifContainer } = createStaffNotification(
                        'middleman',
                        request.ticketId || 'N/A',
                        creatorId || 'Unknown',
                        parseInt(config.primaryColor, 16),
                        request.id,
                        true,
                        request.staffMembers || [],
                        request.claimedBy || null,
                        additionalData
                    );

                    await notifMessage.edit({ components: [notifContainer] }).catch(err => {
                        console.error('[EDIT NOTIF ERROR MIDDLEMAN CLAIM]', err.message);
                    });
                }
            }
        } catch (updateErr) {
            console.error('[UPDATE NOTIF ERROR MIDDLEMAN CLAIM]', updateErr.message);
        }
    }

    const successBlock = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16))
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`✅ ${interaction.user} has claimed this ticket!`)
        );
    await interaction.reply({
        components: [successBlock],
        flags: MessageFlags.IsComponentsV2,
    });
}

async function handleMiddlemanClose(interaction) {
    // Check if user has staff role
    if (!interaction.member.roles.cache.has(config.roles.staff)) {
        const errorBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('❌ Only staff can close tickets!')
            );
        return await interaction.reply({
            components: [errorBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    }

    const modal = new ModalBuilder()
        .setCustomId('close_ticket_modal')
        .setTitle('Close Confirmation');

    const reasonInput = new TextInputBuilder()
        .setCustomId('close_reason')
        .setLabel('Reason for closing (optional)')
        .setPlaceholder('Masukkan alasan menutup request ini...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

    const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

async function handleTicketJoin(interaction, client) {
    const threadId = interaction.customId.replace('ticket_join_', '');
    
    // Check if user has staff role
    if (!interaction.member.roles.cache.has(config.roles.staff)) {
        const errorBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('❌ Only staff can join tickets!')
            );
        return await interaction.reply({
            components: [errorBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    }

    try {
        const thread = await client.channels.fetch(threadId).catch(() => null);
        
        if (!thread || !thread.isThread()) {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Thread not found!')
                );
            return await interaction.reply({
                components: [errorBlock],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            });
        }

        // Add staff ke thread
        await thread.members.add(interaction.user.id);

        // Track staff di thread
        if (!thread.staffMembers) {
            thread.staffMembers = [];
        }
        if (!thread.staffMembers.includes(interaction.user.id)) {
            thread.staffMembers.push(interaction.user.id);
        }

        // Update notification di staff channel
        try {
            const staffChannel = await client.channels.fetch(config.channels.openedTickets);
            if (staffChannel && thread.notifMessageId) {
                const notifMessage = await staffChannel.messages.fetch(thread.notifMessageId).catch(() => null);
                
                if (notifMessage) {
                    // Get creator user for avatar
                    const creatorId = thread.creatorId;
                    const creatorUser = await interaction.guild.members.fetch(creatorId).catch(() => null);
                    const userAvatar = creatorUser?.user.displayAvatarURL({ size: 256, dynamic: true });
                    
                    // Determine ticket type from thread name
                    const ticketType = thread.name?.split('-')[0] || 'help';
                    
                    // Build additional data
                    const additionalData = {
                        userAvatar: userAvatar || ''
                    };

                    // Add product details if this is a purchase or help ticket
                    if ((ticketType === 'purchase' || ticketType === 'help') && thread.productName && thread.paymentMethod) {
                        additionalData.productName = thread.productName;
                        additionalData.paymentMethod = thread.paymentMethod;
                        additionalData.notes = thread.notes || '-';
                    }

                    // Add middleman details if applicable
                    if (ticketType === 'midman' && thread.range) {
                        additionalData.buyerSeller = '-';
                        additionalData.range = thread.range;
                    }

                    // Rebuild notification
                    const { notifContainer } = createStaffNotification(
                        ticketType,
                        thread.ticketId || 'N/A',
                        creatorId || 'Unknown',
                        parseInt(config.primaryColor, 16),
                        thread.id,
                        ticketType === 'midman',
                        thread.staffMembers || [],
                        thread.claimedBy || null,
                        additionalData
                    );

                    await notifMessage.edit({ components: [notifContainer] }).catch(err => {
                        console.error('[EDIT NOTIF ERROR JOIN]', err.message);
                    });
                }
            }
        } catch (updateErr) {
            console.error('[UPDATE NOTIF ERROR JOIN]', updateErr.message);
        }

                    const successBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`✅ <@${interaction.user.id}> has joined the ticket!`)
            );
        await interaction.reply({
            components: [successBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });

        console.log(`[TICKETS] Staff ${interaction.user.tag} joined ticket ${thread.name}. Total staff: ${thread.staffMembers?.length || 0}`);
    } catch (err) {
        console.error('[TICKET JOIN ERROR]', err.message);
        await replyWithError(interaction, 'Gagal join ticket!');
    }
}

async function handleMiddlemanJoin(interaction, client) {
    const requestId = interaction.customId.replace('middleman_join_', '');
    
    // Check if user has staff role
    if (!interaction.member.roles.cache.has(config.roles.staff)) {
        const errorBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('❌ Only staff can join tickets!')
            );
        return await interaction.reply({
            components: [errorBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    }

    try {
        const request = await client.channels.fetch(requestId).catch(() => null);
        
        if (!request || !request.isThread()) {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Request not found!')
                );
            return await interaction.reply({
                components: [errorBlock],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            });
        }

        // Add staff ke request
        await request.members.add(interaction.user.id);

        // Track staff di request
        if (!request.staffMembers) {
            request.staffMembers = [];
        }
        if (!request.staffMembers.includes(interaction.user.id)) {
            request.staffMembers.push(interaction.user.id);
        }

        // Update notification di staff channel
        try {
            const staffChannel = await client.channels.fetch(config.channels.openedTickets);
            if (staffChannel && request.notifMessageId) {
                const notifMessage = await staffChannel.messages.fetch(request.notifMessageId).catch(() => null);
                
                if (notifMessage) {
                    // Get creator user for avatar
                    const creatorId = request.creatorId;
                    const creatorUser = await interaction.guild.members.fetch(creatorId).catch(() => null);
                    const userAvatar = creatorUser?.user.displayAvatarURL({ size: 256, dynamic: true });
                    
                    // Build additional data for middleman
                    const additionalData = {
                        userAvatar: userAvatar || '',
                        buyerSeller: '-',
                        range: request.range || 'Unknown'
                    };

                    // Rebuild notification using createStaffNotification
                    const { notifContainer } = createStaffNotification(
                        'middleman',
                        request.ticketId || 'N/A',
                        creatorId || 'Unknown',
                        parseInt(config.primaryColor, 16),
                        request.id,
                        true,
                        request.staffMembers || [],
                        request.claimedBy || null,
                        additionalData
                    );

                    await notifMessage.edit({ components: [notifContainer] }).catch(err => {
                        console.error('[EDIT NOTIF ERROR MIDDLEMAN JOIN]', err.message);
                    });
                }
            }
        } catch (updateErr) {
            console.error('[UPDATE NOTIF ERROR MIDDLEMAN JOIN]', updateErr.message);
        }

        const successBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`✅ <@${interaction.user.id}> has joined the ticket!`)
            );
        await interaction.reply({
            components: [successBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });

        console.log(`[MIDDLEMAN] Staff ${interaction.user.tag} joined ticket. Total staff: ${request.staffMembers?.length || 0}`);
    } catch (err) {
        console.error('[MIDDLEMAN JOIN ERROR]', err.message);
        await replyWithError(interaction, 'Failed to join ticket!');
    }
}

async function handleMiddlemanUserSelect(interaction, client) {
    const rangeValue = interaction.customId.replace('middleman_user_select_', '');
    const selectedUserId = interaction.values[0];

    const rangeMap = {
        '1': 'Rp 10.000 - Rp 50.000',
        '2': 'Rp 50.001 - Rp 100.000',
        '3': 'Rp 100.001 - Rp 300.000',
        '4': 'Rp 300.001 - Rp 500.000',
        '5': 'Rp 500.001 - Rp 1.000.000',
        '6': '> Rp 1.000.000'
    };

    const feeMap = {
        '1': 'Rp 2.000',
        '2': 'Rp 5.000',
        '3': 'Rp 10.000',
        '4': 'Rp 15.000',
        '5': 'Rp 25.000',
        '6': '2% flat'
    };

    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (deferErr) {
        console.warn(`[MIDDLEMAN USER SELECT] Failed to defer: ${deferErr.message}`);
        return;
    }

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

        const threadName = `midman-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

        const newRequest = await middlemanChannel.threads.create({
            name: threadName,
            autoArchiveDuration: 10080,
            reason: `Middleman request created by ${interaction.user.tag}`,
            type: ChannelType.PrivateThread,
        });

        // Create buttons for the ticket
        const closeBtn = new ButtonBuilder()
            .setCustomId('middleman_close')
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Secondary);

        const claimBtn = new ButtonBuilder()
            .setCustomId('middleman_claim')
            .setLabel('Claim Ticket')
            .setStyle(ButtonStyle.Secondary);

        const addMemberBtn = new ButtonBuilder()
            .setCustomId('middleman_add')
            .setLabel('Add Member')
            .setStyle(ButtonStyle.Secondary);

        // Send middleman ticket message using template
        const { embed1, embed2, embed3 } = createMiddlemanTicketMessage(interaction.user, {
            rangeTransaction: rangeMap[rangeValue],
            fee: feeMap[rangeValue],
            taggedUsers: [interaction.user]
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
        await newRequest.members.add(selectedUserId);

        // Send staff notification
        try {
            const staffChannel = await client.channels.fetch(config.channels.openedTickets);
            if (staffChannel) {
                const requestId = `MID-${interaction.guild.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

                // Get user avatar
                const userAvatar = interaction.user.displayAvatarURL({ size: 256, dynamic: true });

                try {
                    const notifTitle = new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`## 🎫 Join Ticket\n\nA new ticket has been opened.\nYou may respond to the ticket if you're available!`)
                        );
                    
                    // Only set thumbnail if avatar URL exists and is valid
                    if (userAvatar && userAvatar.length > 0) {
                        try {
                            const thumbnail = new ThumbnailBuilder({ media: { url: userAvatar } });
                            notifTitle.setThumbnailAccessory(thumbnail);
                        } catch (thumbErr) {
                            console.warn(`[MIDDLEMAN USER SELECT] Failed to create thumbnail: ${thumbErr.message}`);
                        }
                    }

                    const requestDetails = new TextDisplayBuilder()
                        .setContent(`• **Ticket ID:** ${requestId}\n• **Type:** Transaction\n• **Opened by:** <@${interaction.user.id}>\n• **Claimed by:** Not claimed yet`);

                    const buyerSellerInfo = new TextDisplayBuilder()
                        .setContent(`• **Buyer/Seller:** <@${selectedUserId}>\n• **Range:** ${rangeMap[rangeValue]}`);

                    const staffCount = new TextDisplayBuilder()
                        .setContent(`• **Staff in Ticket:** 0\n• **Staff Members:** None`);

                    const notifSep = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);

                    const notifContainer = new ContainerBuilder()
                        .addSectionComponents(notifTitle)
                        .addSeparatorComponents(notifSep)
                        .addTextDisplayComponents(requestDetails)
                        .addSeparatorComponents(notifSep)
                        .addTextDisplayComponents(buyerSellerInfo)
                        .addSeparatorComponents(notifSep)
                        .addTextDisplayComponents(staffCount);

                    notifContainer.addSeparatorComponents(notifSep);

                    const joinBtn = new ButtonBuilder()
                        .setCustomId(`middleman_join_${newRequest.id}`)
                        .setLabel('Join Ticket')
                        .setStyle(ButtonStyle.Secondary);

                    const buttonRow = new ActionRowBuilder().addComponents(joinBtn);
                    notifContainer.addActionRowComponents(buttonRow);

                    // Send staff mention message
                    const staffMentionMessage = await staffChannel.send(`<@&${config.roles.staff}>`);

                    // Don't send content field with IsComponentsV2, staff mention is inside the container
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
                    newRequest.range = rangeMap[rangeValue];
                    newRequest.buyerSellerId = selectedUserId;

                    console.log(`[MIDDLEMAN] Notifikasi sent to staff channel - Request ID: ${requestId}`);
                } catch (containerErr) {
                    console.error('[MIDDLEMAN NOTIF CONTAINER ERROR]', containerErr);
                }
            }
        } catch (notifErr) {
            console.error('[MIDDLEMAN NOTIF ERROR]', notifErr.message);
        }

        try {
            // Create response with separator
            const titleSection = new TextDisplayBuilder()
                .setContent(`# HAJI UTONG - Middleman`);

            const separator1 = new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(SeparatorSpacingSize.Large);

            const separator2 = new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(SeparatorSpacingSize.Large);

            const descriptionSection = new TextDisplayBuilder()
                .setContent(`Ticket kamu sudah dibuat!\nHarap tunggu sampai Admin respon ke ticket kamu!`);

            // View ticket button
            const viewBtn = new ButtonBuilder()
                .setLabel('View Ticket')
                .setStyle(ButtonStyle.Link)
                .setURL(newRequest.url);

            const buttonRow = new ActionRowBuilder().addComponents(viewBtn);

            const container = new ContainerBuilder()
                .addTextDisplayComponents(titleSection)
                .addSeparatorComponents(separator1)
                .addTextDisplayComponents(descriptionSection)
                .addSeparatorComponents(separator2)
                .addActionRowComponents(buttonRow);

            await interaction.editReply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
        } catch (ephemeralErr) {
            console.error('[MIDDLEMAN EPHEMERAL ERROR]', ephemeralErr);
            // Fallback to simple container
            const fallbackContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`# HAJI UTONG - Middleman`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`✅ Ticket kamu sudah dibuat: <#${newRequest.id}>`)
                );

            try {
                await interaction.editReply({
                    components: [fallbackContainer],
                    flags: MessageFlags.IsComponentsV2,
                });
            } catch (fallbackErr) {
                console.error('[MIDDLEMAN FALLBACK ERROR]', fallbackErr.message);
            }
        }

        console.log(`[MIDDLEMAN] Request dibuat oleh ${interaction.user.tag} - Range: ${rangeMap[rangeValue]} - User ditambahkan: ${selectedUserId}`);
    } catch (error) {
        console.error('[MIDDLEMAN CREATE ERROR]', error);
        await replyWithError(interaction, error.message, true);
    }
}

async function handleTicketAddUser(interaction) {
    const selectedUserId = interaction.values[0];
    const thread = interaction.channel;

    if (!thread || !thread.isThread()) {
        const errorBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('❌ Hanya bisa digunakan di ticket!')
            );
        return await interaction.reply({
            components: [errorBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    }

    try {
        // Get bot member untuk check permissions
        const botMember = await thread.guild.members.fetch(interaction.client.user.id).catch(() => null);

        if (!botMember) {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Bot tidak ditemukan di server!')
                );
            return await interaction.reply({
                components: [errorBlock],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            });
        }

        // Check if bot has permission to manage threads
        if (!botMember.permissions.has('ManageChannels')) {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Bot tidak memiliki permission **Manage Channels**!')
                );
            return await interaction.reply({
                components: [errorBlock],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            });
        }

        // Add user ke thread
        await thread.members.add(selectedUserId);

        const successBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`✅ User has been added to the ticket!`)
            );
        await interaction.reply({
            components: [successBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });

        console.log(`[TICKETS] User ${selectedUserId} added to ticket ${thread.name}`);
    } catch (err) {
        console.error('[ADD MEMBER ERROR]', err.message);
        await replyWithError(interaction, `Gagal menambahkan user!\n\n**Error:** ${err.message}`);
    }
}

async function handleMiddlemanAddUser(interaction) {
    const selectedUserId = interaction.values[0];
    const thread = interaction.channel;

    if (!thread || !thread.isThread()) {
        const errorBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('❌ Only usable in middleman tickets!')
            );
        return await interaction.reply({
            components: [errorBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    }

    try {
        // Get bot member untuk check permissions
        const botMember = await thread.guild.members.fetch(interaction.client.user.id).catch(() => null);

        if (!botMember) {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Bot not found in the server!')
                );
            return await interaction.reply({
                components: [errorBlock],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            });
        }

        // Check if bot has permission to manage threads
        if (!botMember.permissions.has('ManageChannels')) {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Bot does not have **Manage Channels** permission!')
                );
            return await interaction.reply({
                components: [errorBlock],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            });
        }

        // Add user ke thread
        await thread.members.add(selectedUserId);

        // Get user object for greeting
        const selectedUser = await interaction.client.users.fetch(selectedUserId).catch(() => null);

        // Send greeting message in thread
        if (selectedUser) {
            await thread.send({
                content: `Selamat Sore, <@${selectedUserId}>`,
                flags: MessageFlags.Suppress,
            });
        }

        const successBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`✅ Buyer/Seller has been added to the ticket!`)
            );
        await interaction.reply({
            components: [successBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });

        console.log(`[MIDDLEMAN] User ${selectedUserId} added to ticket ${thread.name}`);
    } catch (err) {
        console.error('[MIDDLEMAN ADD MEMBER ERROR]', err.message);
        await replyWithError(interaction, `Failed to add user!\n\n**Error:** ${err.message}`);
    }
}

async function handleMiddlemanFormBuyer(interaction) {
    const buyerModal = new ModalBuilder()
        .setCustomId('middleman_buyer_form_modal')
        .setTitle('Form Pembeli');

    const namaInput = new TextInputBuilder()
        .setCustomId('buyer_nama')
        .setLabel('Nama Lengkap')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const barangInput = new TextInputBuilder()
        .setCustomId('buyer_barang')
        .setLabel('Jenis Barang yang Dibeli')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const hargaInput = new TextInputBuilder()
        .setCustomId('buyer_harga')
        .setLabel('Harga Barang (Rp)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Contoh: 500000')
        .setRequired(true);

    const ketInput = new TextInputBuilder()
        .setCustomId('buyer_ket')
        .setLabel('Keterangan Tambahan')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Inc/Ex, Reffull/Noreff, dll')
        .setRequired(false);

    const row1 = new ActionRowBuilder().addComponents(namaInput);
    const row2 = new ActionRowBuilder().addComponents(barangInput);
    const row3 = new ActionRowBuilder().addComponents(hargaInput);
    const row4 = new ActionRowBuilder().addComponents(ketInput);

    buyerModal.addComponents(row1, row2, row3, row4);
    return await interaction.showModal(buyerModal);
}

async function handleMiddlemanFormSeller(interaction) {
    const sellerModal = new ModalBuilder()
        .setCustomId('middleman_seller_form_modal')
        .setTitle('Form Penjual');

    const namaInput = new TextInputBuilder()
        .setCustomId('seller_nama')
        .setLabel('Nama Lengkap')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const barangInput = new TextInputBuilder()
        .setCustomId('seller_barang')
        .setLabel('Jenis Barang yang Dijual')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const hargaInput = new TextInputBuilder()
        .setCustomId('seller_harga')
        .setLabel('Harga Barang (Rp)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Contoh: 500000')
        .setRequired(true);

    const ketInput = new TextInputBuilder()
        .setCustomId('seller_ket')
        .setLabel('Keterangan Tambahan')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Inc/Ex, Reffull/Noreff, dll')
        .setRequired(false);

    const row1 = new ActionRowBuilder().addComponents(namaInput);
    const row2 = new ActionRowBuilder().addComponents(barangInput);
    const row3 = new ActionRowBuilder().addComponents(hargaInput);
    const row4 = new ActionRowBuilder().addComponents(ketInput);

    sellerModal.addComponents(row1, row2, row3, row4);
    return await interaction.showModal(sellerModal);
}

function replyWithError(interaction, message, isEditReply = false) {
    const errorBlock = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16))
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`❌ ${message}`)
        );

    const replyOptions = {
        components: [errorBlock],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    };

    try {
        if (isEditReply || interaction.replied || interaction.deferred) {
            return interaction.editReply(replyOptions);
        } else {
            return interaction.reply(replyOptions);
        }
    } catch (err) {
        console.error('[REPLY ERROR]', err.message);
        // Silently fail if interaction is expired or already acknowledged
    }
}

module.exports = { handleTicketInteractions };
