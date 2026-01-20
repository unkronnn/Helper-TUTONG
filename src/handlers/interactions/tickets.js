const { MessageFlags, TextDisplayBuilder, ContainerBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits, SeparatorBuilder, ThumbnailBuilder, SectionBuilder } = require('discord.js');
const config = require('../../config/config.json');
const {
    handleTicketPurchaseButton,
    handleTicketHelpButton,
    handleTicketAddButton,
    handleMiddlemanRequestButton,
    handleMiddlemanAddButton,
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

        // Update notification di staff channel
        try {
            const staffChannel = await client.channels.fetch(config.channels.openedTickets);
            if (staffChannel && thread.notifMessageId) {
                const notifMessage = await staffChannel.messages.fetch(thread.notifMessageId).catch(() => null);
                
                if (notifMessage) {
                    // Build staff members list
                    let staffMembersList = '';
                    if (thread.staffMembers && thread.staffMembers.length > 0) {
                        staffMembersList = thread.staffMembers.map(id => `<@${id}>`).join(', ');
                    } else {
                        staffMembersList = 'None';
                    }

                    const staffCountText = `${thread.staffMembers?.length || 0}`;
                    const claimedByText = thread.claimedBy ? `<@${thread.claimedBy}>` : 'Not claimed yet';

                    const updatedContainer = new ContainerBuilder()
                        .setAccentColor(parseInt(config.primaryColor, 16))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`## 🎫 Join Ticket\n\n**A Ticket is Opened!**`)
                        )
                        .addSeparatorComponents(new SeparatorBuilder())
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`• **Claimed by:** ${claimedByText}\n• **Staff in Ticket:** ${staffCountText}\n• **Staff Members:** ${staffMembersList}`)
                        );

                    await notifMessage.edit({ components: [updatedContainer] }).catch(err => {
                        console.error('[EDIT NOTIF ERROR]', err.message);
                    });
                }
            }
        } catch (updateErr) {
            console.error('[UPDATE NOTIF ERROR]', updateErr.message);
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

        // Update notification di staff channel
        try {
            const staffChannel = await client.channels.fetch(config.channels.openedTickets);
            if (staffChannel && request.notifMessageId) {
                const notifMessage = await staffChannel.messages.fetch(request.notifMessageId).catch(() => null);
                
                if (notifMessage) {
                    // Build staff members list
                    let staffMembersList = '';
                    if (request.staffMembers && request.staffMembers.length > 0) {
                        staffMembersList = request.staffMembers.map(id => `<@${id}>`).join(', ');
                    } else {
                        staffMembersList = 'None';
                    }

                    const staffCountText = `${request.staffMembers?.length || 0}`;
                    const claimedByText = request.claimedBy ? `<@${request.claimedBy}>` : 'Not claimed yet';

                    const updatedContainer = new ContainerBuilder()
                        .setAccentColor(parseInt(config.primaryColor, 16))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`## 🎫 Join Ticket\n\n**A Middleman Ticket is Opened!**`)
                        )
                        .addSeparatorComponents(new SeparatorBuilder())
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`• **Claimed by:** ${claimedByText}\n• **Staff in Request:** ${staffCountText}\n• **Staff Members:** ${staffMembersList}`)
                        );

                    await notifMessage.edit({ components: [updatedContainer] }).catch(err => {
                        console.error('[EDIT NOTIF ERROR]', err.message);
                    });
                }
            }
        } catch (updateErr) {
            console.error('[UPDATE NOTIF ERROR]', updateErr.message);
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

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
        const accentColor = parseInt(config.primaryColor, 16);

        const title = new TextDisplayBuilder().setContent('# Voxteria - Middleman');
        const description = new TextDisplayBuilder().setContent(`Terima kasih sudah membuat request middleman.
Silahkan tambahkan pembeli dan penjual lainnya ke thread ini, kemudian tunggu tim staff kami untuk mengkonfirmasi request kamu.

## 🚫 **Catatan:**
• Klik tombol "Add Member" untuk menambahkan pembeli dan penjual.
• Tim staff akan memverifikasi request kamu.
• Hindari membuat request bohongan, karena bisa berakibat blacklist.

Terima kasih atas kepercayaan kamu! 🙏`);

        const transactionInfo = new TextDisplayBuilder()
            .setContent(`**Range Transaksi:** ${rangeMap[rangeValue]}\n**Biaya:** ${feeMap[rangeValue]}`);

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
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger);

        const claimBtn = new ButtonBuilder()
            .setCustomId('middleman_claim')
            .setLabel('Claim Ticket')
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
Harga Barang yang Dijual : Rp. (contoh: Rp. 2.000.000)
Inc/Ex :
\`\`\`

**Catatan:**
• Inc = Harga sudah termasuk biaya middleman
• Ex = Harga belum termasuk biaya middleman`
            });
            console.log('[FORM] ✓ Form sent successfully to user select thread');
        } catch (formErr) {
            console.error('[FORM ERROR - USER SELECT]', formErr);
        }

        await newRequest.members.add(interaction.user.id);
        await newRequest.members.add(selectedUserId);

        // Send staff notification
        try {
            const staffChannel = await client.channels.fetch(config.channels.openedTickets);
            if (staffChannel) {
                const requestId = `MID-${interaction.guild.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
                const userAvatar = interaction.user.displayAvatarURL({ size: 256, dynamic: true });

                const thumbnail = new ThumbnailBuilder({ media: { url: userAvatar } });
                const notifTitle = new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🎫 Join Ticket\n\n**A Middleman Ticket is Opened!**`))
                    .setThumbnailAccessory(thumbnail);

                const requestDetails = new TextDisplayBuilder()
                    .setContent(`• **Ticket ID:** ${requestId}\n• **Type:** Transaction\n• **Opened by:** <@${interaction.user.id}>\n• **Claimed by:** Not claimed yet`);

                const buyerSellerInfo = new TextDisplayBuilder()
                    .setContent(`• **Buyer/Seller:** <@${selectedUserId}>\n• **Range:** ${rangeMap[rangeValue]}`);

                const staffCount = new TextDisplayBuilder()
                    .setContent(`• **Staff in Ticket:** 0\n• **Staff Members:** None`);

                const staffPing = new TextDisplayBuilder()
                    .setContent(`<@&${config.roles.staff}> - Ticket Baru!`);

                const notifSep = new SeparatorBuilder();

                const notifContainer = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(staffPing)
                    .addSeparatorComponents(notifSep)
                    .addSectionComponents(notifTitle)
                    .addSeparatorComponents(notifSep)
                    .addTextDisplayComponents(requestDetails)
                    .addSeparatorComponents(notifSep)
                    .addTextDisplayComponents(buyerSellerInfo)
                    .addSeparatorComponents(notifSep)
                    .addTextDisplayComponents(staffCount);

                const joinBtn = new ButtonBuilder()
                    .setCustomId(`middleman_join_${newRequest.id}`)
                    .setLabel('Join Ticket')
                    .setStyle(ButtonStyle.Secondary);

                const notifButtonRow = new ActionRowBuilder().addComponents(joinBtn);

                const notifMessage = await staffChannel.send({
                    components: [notifContainer, notifButtonRow],
                    flags: MessageFlags.IsComponentsV2,
                });

                newRequest.requestId = requestId;
                newRequest.notifMessageId = notifMessage.id;
                newRequest.staffMembers = [];
                newRequest.claimedBy = null;
                newRequest.creatorId = interaction.user.id;
                newRequest.range = rangeMap[rangeValue];
                newRequest.buyerSellerId = selectedUserId;

                console.log(`[MIDDLEMAN] Notifikasi sent to staff channel - Request ID: ${requestId}`);
            }
        } catch (notifErr) {
            console.error('[MIDDLEMAN NOTIF ERROR]', notifErr.message);
        }

        const replyTitle = new TextDisplayBuilder().setContent(`## 🤝 Voxteria - Middleman`);
        const replyDesc = new TextDisplayBuilder().setContent(`Ticket kamu sudah dibuat: <#${newRequest.id}>\n\n✅ <@${selectedUserId}> telah ditambahkan ke thread.\n\nTambahkan pembeli/penjual lainnya dengan tombol "Add Member" jika diperlukan, lalu tunggu staff kami untuk mengklaim request kamu.`);
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

        console.log(`[MIDDLEMAN] Request dibuat oleh ${interaction.user.tag} - Range: ${rangeMap[rangeValue]} - User ditambahkan: ${selectedUserId}`);
    } catch (error) {
        console.error('[MIDDLEMAN CREATE ERROR]', error.message);
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

    if (isEditReply) {
        return interaction.editReply(replyOptions);
    } else {
        return interaction.reply(replyOptions);
    }
}

module.exports = { handleTicketInteractions };
