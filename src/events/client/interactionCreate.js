const {
    MessageFlags,
    TextDisplayBuilder,
    ContainerBuilder,
    EmbedBuilder,
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
    PermissionFlagsBits,
} = require('discord.js');
const config = require('../../config/config.json');
const fs = require('fs');
const path = require('path');
const {
    handleTicketPurchaseButton,
    handleTicketHelpButton,
    handleTicketAddButton,
    handlePurchaseFormModal,
    handleMiddlemanRequestButton,
    handleMiddlemanHelpButton,
    handleMiddlemanAddButton,
} = require('../../handlers/ticketHandler');

const paymentsFile = path.join(__dirname, '../../config/payments.json');

const getPayments = () => {
  const data = fs.readFileSync(paymentsFile, 'utf8');
  return JSON.parse(data);
};

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(client, interaction) {
        try {
            if (interaction.isChatInputCommand()) {

                // Block DM (server-only commands)
                if (!interaction.guild) {
                    const accentColor = parseInt(config.color.replace('#', ''), 16);
                    const dmBlock = new ContainerBuilder()
                        .setAccentColor(accentColor)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`${config.crossmark_emoji} This command can only be used in a server.`)
                        );

                    return interaction.reply({
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        components: [dmBlock],
                    });
                }

                const command = client.slash.get(interaction.commandName);
                if (!command) return;

                await command.run(client, interaction, interaction.options);
            }

            // Handle payment select menu
            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'middleman_range_select') {
                    // Handle middleman range selection - show user select menu
                    const rangeValue = interaction.values[0];
                    
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

                    const userSelect = new UserSelectMenuBuilder()
                        .setCustomId(`middleman_user_select_${rangeValue}`)
                        .setPlaceholder('Pilih pembeli atau penjual')
                        .setMaxValues(1);

                    const selectRow = new ActionRowBuilder().addComponents(userSelect);

                    const titleBlock = new TextDisplayBuilder()
                        .setContent(`# Voxteria - Middleman\n**Tambahkan Pembeli/Penjual**\n\n**✅ Range Transaksi Dipilih: **${rangeMap[rangeValue]}\n**💰 Biaya:** ${feeMap[rangeValue]}\n\nSekarang pilih pembeli atau penjual yang akan ditambahkan ke ticket:`);

                    const container = new ContainerBuilder()
                        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                        .addTextDisplayComponents(titleBlock);

                    await interaction.update({
                        components: [container, selectRow],
                        flags: MessageFlags.IsComponentsV2,
                    });
                    return;
                }

                if (interaction.customId !== 'payment_select') return;

                const selectedValue = interaction.values[0];
                const payments = getPayments();

                let embed = new EmbedBuilder()
                    .setColor(parseInt(config.color.replace('#', ''), 16))
                    .setFooter({ text: '© Voxteria Payment System' });

                switch(selectedValue) {
                    case 'jago':
                        embed
                            .setTitle('💳 Bank Jago')
                            .addFields(
                                { name: 'Nomor Rekening', value: payments.lokal.jago.norek || '❌ Belum diatur', inline: false }
                            );
                        break;
                    case 'seabank':
                        embed
                            .setTitle('💳 Seabank')
                            .addFields(
                                { name: 'Nomor Rekening', value: payments.lokal.seabank.norek || '❌ Belum diatur', inline: false }
                            );
                        break;
                    case 'qris':
                        embed
                            .setTitle('📱 QRIS')
                            .setDescription('Scan QRIS di bawah untuk melakukan pembayaran');
                        if (payments.lokal.qris.imageUrl) {
                            embed.setImage(payments.lokal.qris.imageUrl);
                        }
                        break;
                    case 'btc':
                        embed
                            .setTitle('💰 Bitcoin (BTC)')
                            .addFields(
                                { name: 'Alamat Wallet', value: payments.internasional.crypto.btc || '❌ Belum diatur', inline: false }
                            );
                        break;
                    case 'ethereum':
                        embed
                            .setTitle('💎 Ethereum (ERC20)')
                            .addFields(
                                { name: 'Alamat Wallet', value: payments.internasional.crypto.ethereum_erc20 || '❌ Belum diatur', inline: false }
                            );
                        break;
                    case 'usdt':
                        embed
                            .setTitle('💵 USDT (ERC20)')
                            .addFields(
                                { name: 'Alamat Wallet', value: payments.internasional.crypto.usdt_erc20 || '❌ Belum diatur', inline: false }
                            );
                        break;
                    case 'paypal':
                        embed
                            .setTitle('🔑 PayPal F&F')
                            .addFields(
                                { name: 'Email PayPal', value: payments.internasional.paypal.email || '❌ Belum diatur', inline: false }
                            );
                        break;
                    case 'binance':
                        embed
                            .setTitle('🟡 Binance')
                            .setDescription('Scan QR Binance di bawah atau gunakan Binance ID')
                            .addFields(
                                { name: 'Binance ID', value: payments.internasional.binance.id || '❌ Belum diatur', inline: false }
                            );
                        if (payments.internasional.binance.qrUrl) {
                            embed.setImage(payments.internasional.binance.qrUrl);
                        }
                        break;
                }

                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            // Handle user select menus
            if (interaction.isUserSelectMenu()) {
                // Handle middleman user select to create thread
                if (interaction.customId.startsWith('middleman_user_select_')) {
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

                        const threadName = `midman-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
                        const accentColor = parseInt(config.color.replace('#', ''), 16);

                        const title = new TextDisplayBuilder().setContent('# Voxteria - Middleman');
                        const description = new TextDisplayBuilder().setContent(`Terima kasih sudah membuat request middleman.
Silahkan tambahkan pembeli dan penjual lainnya ke thread ini, kemudian tunggu tim staff kami untuk mengkonfirmasi request kamu.

## 🚫 **Catatan:**
• Klik tombol "Add Member" untuk menambahkan pembeli dan penjual.
• Tim staff akan memverifikasi request kamu.
• Hindari membuat request bohongan, karena bisa berakibat blacklist.

Terima kasih atas kepercayaan kamu! 🙏`);

                        const transactionInfo = new TextDisplayBuilder()
                            .setContent(`**Range Transaksi:** ${rangeMap[rangeValue]}`);

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
Harga Barang yang Dijual : Rp. 
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
                            const staffChannel = await client.channels.fetch(config.notificationChannelId);
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
                                    .setContent(`<@&${config.staffRoleId}> - Ticket Baru!`);

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
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
                            );
                        await interaction.editReply({
                            components: [errorBlock],
                            flags: MessageFlags.IsComponentsV2,
                        });
                    }
                    return;
                }
            }

            // Handle ticket buttons
            if (interaction.isButton()) {
                if (interaction.customId === 'status_toggle_btn') {
                    try {
                        // Check if user has admin/staff role
                        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && !interaction.member.roles.cache.has(config.staffRoleId)) {
                            const errorBlock = new ContainerBuilder()
                                .setAccentColor(0xFF0000)
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent('❌ Hanya admin atau staff yang bisa toggle status toko!')
                                );
                            return await interaction.reply({
                                content: '',
                                components: [errorBlock],
                                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                            });
                        }

                        const fs = require('fs');
                        const path = require('path');
                        const statusFile = path.join(__dirname, '../../config/status.json');

                        const getStatus = () => {
                            const data = fs.readFileSync(statusFile, 'utf8');
                            return JSON.parse(data);
                        };

                        const setStatus = (isOpen, updatedBy) => {
                            const status = {
                                isOpen,
                                lastUpdated: new Date().toISOString(),
                                updatedBy
                            };
                            fs.writeFileSync(statusFile, JSON.stringify(status, null, 2), 'utf8');
                            return status;
                        };

                        const currentStatus = getStatus();
                        const newStatus = !currentStatus.isOpen;
                        setStatus(newStatus, interaction.user.tag);
                        logger.info(`[STATUS] Status changed to ${newStatus ? 'OPEN' : 'CLOSED'}`);

                        // Update voice channel name
                        try {
                            const statusChannel = await interaction.client.channels.fetch(config.statusVoiceChannelId);
                            if (statusChannel && statusChannel.isVoiceBased()) {
                                const statusEmoji = newStatus ? '🟢' : '🔴';
                                const statusText = newStatus ? 'OPEN' : 'CLOSED';
                                await statusChannel.setName(`STATUS: ${statusEmoji} [${statusText}]`);
                                logger.info(`[STATUS] Voice channel updated: STATUS: ${statusEmoji} [${statusText}]`);
                            }
                        } catch (err) {
                            logger.error(`[STATUS] Failed to update voice channel: ${err.message}`);
                        }

                        const title = newStatus ? `WE ARE OPEN` : `🔒 We're Closed for Today!`;
                        const description = newStatus 
                            ? `Yang mau nanya-nanya dulu, atau yang udah siap gas order, pintu selalu terbuka. Jangan ragu buat apa admin di tiket ya. Gas bikin tiket sekarang, mumpung antrean masih aman! 🔥`
                            : `Ticket system bakal kami lock setelah ini! buat yang sudah buka ticket akan tetap direspon sampai trx/kendala kamu selesai`;
                        
                        const content = `# ${title}

<@&${config.memberRoleId}>

${description}`;

                        const toggleBtn = new ButtonBuilder()
                            .setCustomId('status_toggle_btn')
                            .setLabel(newStatus ? 'Close Store' : 'Open Store')
                            .setStyle(newStatus ? ButtonStyle.Danger : ButtonStyle.Success);

                        const buttonRow = new ActionRowBuilder().addComponents(toggleBtn);

                        await interaction.update({
                            content: content,
                            components: [buttonRow],
                        }).catch(err => {
                            console.error('[STATUS UPDATE ERROR]', err.message);
                        });

                        console.log(`[STATUS] Store status toggled to ${newStatus ? 'OPEN' : 'CLOSED'} by ${interaction.user.tag}`);
                    } catch (error) {
                        console.error('[STATUS TOGGLE ERROR]', error);
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(0xFF0000)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
                            );
                        try {
                            await interaction.reply({
                                content: '',
                                components: [errorBlock],
                                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                            });
                        } catch (replyErr) {
                            console.error('[STATUS REPLY ERROR]', replyErr.message);
                        }
                    }
                    return;
                } else if (interaction.customId === 'review_submit') {
                    // Show review form modal
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
                } else if (interaction.customId === 'ticket_purchase') {
                    return await handleTicketPurchaseButton(interaction, client);
                } else if (interaction.customId === 'ticket_help') {
                    return await handleTicketHelpButton(interaction, client);
                } else if (interaction.customId === 'middleman_request') {
                    return await handleMiddlemanRequestButton(interaction, client);
                } else if (interaction.customId === 'middleman_help') {
                    return await handleMiddlemanHelpButton(interaction, client);
                }
                // Handle ticket join untuk staff
                if (interaction.customId.startsWith('ticket_join_')) {
                    const threadId = interaction.customId.replace('ticket_join_', '');
                    
                    // Check jika user punya staff role
                    if (!interaction.member.roles.cache.has(config.staffRoleId)) {
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent('❌ Hanya staff yang bisa join ticket!')
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
                                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent('❌ Thread tidak ditemukan!')
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
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`✅ <@${interaction.user.id}> telah join ticket!`)
                            );
                        await interaction.reply({
                            components: [successBlock],
                            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        });

                        // Update notification di staff channel
                        try {
                            const staffChannel = await client.channels.fetch(config.notificationChannelId);
                            if (staffChannel && thread.notifMessageId) {
                                const notifMessage = await staffChannel.messages.fetch(thread.notifMessageId).catch(() => null);
                                
                                if (notifMessage) {
                                    // Build staff members list
                                    let staffMembersList = '';
                                    if (thread.staffMembers && thread.staffMembers.length > 0) {
                                        for (const staffId of thread.staffMembers) {
                                            staffMembersList += `<@${staffId}> `;
                                        }
                                    }

                                    // Get ticket creator info
                                    let creatorTag = 'Unknown';
                                    let creatorAvatar = null;
                                    try {
                                        if (thread.creatorId) {
                                            const creator = await client.users.fetch(thread.creatorId);
                                            creatorTag = creator.tag;
                                            creatorAvatar = creator.displayAvatarURL({ size: 256, dynamic: true });
                                        }
                                    } catch (e) {}

                                    // Extract ticket ID from topic
                                    let ticketId = 'N/A';
                                    if (thread.topic) {
                                        const match = thread.topic.match(/(?:Ticket|Request) ID: ([\w-]+)/);
                                        if (match) ticketId = match[1];
                                    }

                                    const thumbnail = new ThumbnailBuilder({ media: { url: creatorAvatar || '' } });
                                    const notifTitle = new SectionBuilder()
                                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## **🎫 Join Ticket**\n\n**A ${thread.name.includes('purchase') ? 'Purchase' : 'Helper'} Ticket is Opened!**`))
                                        .setThumbnailAccessory(thumbnail);

                                    const basicInfo = new TextDisplayBuilder()
                                        .setContent(`• **Ticket ID:** ${ticketId}\n• **Opened by:** <@${thread.creatorId || '?'}>\n• **Claimed by:** ${thread.claimedBy ? `<@${thread.claimedBy}>` : 'Not claimed yet'}`);

                                    const staffCount = new TextDisplayBuilder()
                                        .setContent(`• **Staff in Ticket:** ${thread.staffMembers?.length || 0}\n• **Staff Members:** ${staffMembersList.trim() || 'None'}`);

                                    const notifSep = new SeparatorBuilder();

                                    const notifContainer = new ContainerBuilder()
                                        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                                        .addSectionComponents(notifTitle)
                                        .addSeparatorComponents(notifSep)
                                        .addTextDisplayComponents(basicInfo)
                                        .addSeparatorComponents(notifSep);
                                    
                                    // Add product details if it's a purchase ticket
                                    if (thread.name.includes('purchase') && thread.productName && thread.paymentMethod) {
                                        const productDetails = new TextDisplayBuilder()
                                            .setContent(`**Product:** ${thread.productName}\n**Payment Method:** ${thread.paymentMethod}\n**Description:** ${thread.notes || '-'}`);
                                        notifContainer.addTextDisplayComponents(productDetails)
                                            .addSeparatorComponents(notifSep);
                                    }
                                    
                                    notifContainer.addTextDisplayComponents(staffCount);

                                    const joinBtn = new ButtonBuilder()
                                        .setCustomId(`ticket_join_${threadId}`)
                                        .setLabel('Join Ticket')
                                        .setStyle(ButtonStyle.Secondary);

                                    const notifButtonRow = new ActionRowBuilder()
                                        .addComponents(joinBtn);

                                    await notifMessage.edit({
                                        components: [notifContainer, notifButtonRow],
                                        flags: MessageFlags.IsComponentsV2,
                                    });
                                }
                            }
                        } catch (updateErr) {
                            console.error('[UPDATE NOTIF ERROR]', updateErr.message);
                        }

                        console.log(`[TICKETS] Staff ${interaction.user.tag} joined ticket ${thread.name}. Total staff: ${thread.staffMembers?.length || 0}`);
                    } catch (err) {
                        console.error('[TICKET JOIN ERROR]', err.message);
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent('❌ Gagal join ticket!')
                            );
                        await interaction.reply({
                            components: [errorBlock],
                            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        });
                    }
                    return;
                }

                // Handle ticket management buttons
                if (interaction.customId === 'ticket_close') {
                    // Check jika user punya staff role
                    if (!interaction.member.roles.cache.has(config.staffRoleId)) {
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent('❌ Hanya staff yang bisa close ticket!')
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
                } else if (interaction.customId === 'ticket_claim') {
                    // Check jika user punya staff role
                    if (!interaction.member.roles.cache.has(config.staffRoleId)) {
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent('❌ Hanya staff yang bisa claim ticket!')
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
                            const staffChannel = await client.channels.fetch(config.notificationChannelId);
                            if (staffChannel && thread.notifMessageId) {
                                const notifMessage = await staffChannel.messages.fetch(thread.notifMessageId).catch(() => null);
                                
                                if (notifMessage) {
                                    // Build staff members list
                                    let staffMembersList = '';
                                    if (thread.staffMembers && thread.staffMembers.length > 0) {
                                        for (const staffId of thread.staffMembers) {
                                            staffMembersList += `<@${staffId}> `;
                                        }
                                    }

                                    // Get ticket creator info - use stored creatorId for consistent avatar
                                    let creatorAvatar = null;
                                    try {
                                        if (thread.creatorId) {
                                            const creator = await client.users.fetch(thread.creatorId);
                                            creatorAvatar = creator.displayAvatarURL({ size: 256, dynamic: true });
                                        }
                                    } catch (e) {}

                                    // Extract ticket ID from topic
                                    let ticketId = 'N/A';
                                    if (thread.topic) {
                                        const match = thread.topic.match(/(?:Ticket|Request) ID: ([\w-]+)/);
                                        if (match) ticketId = match[1];
                                    }

                                    const thumbnail = new ThumbnailBuilder({ media: { url: creatorAvatar || '' } });
                                    const notifTitle = new SectionBuilder()
                                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## **🎫 Join Ticket**\n\n**A ${thread.name.includes('purchase') ? 'Purchase' : 'Helper'} Ticket is Opened!**`))
                                        .setThumbnailAccessory(thumbnail);

                                    const basicInfo = new TextDisplayBuilder()
                                        .setContent(`• **Ticket ID:** ${ticketId}\n• **Opened by:** <@${thread.creatorId || '?'}>\n• **Claimed by:** <@${interaction.user.id}>`);

                                    const notifSep = new SeparatorBuilder();

                                    const notifContainer = new ContainerBuilder()
                                        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                                        .addSectionComponents(notifTitle)
                                        .addSeparatorComponents(notifSep)
                                        .addTextDisplayComponents(basicInfo)
                                        .addSeparatorComponents(notifSep);
                                    
                                    // Add product details if it's a purchase ticket
                                    if (thread.name.includes('purchase') && thread.productName && thread.paymentMethod) {
                                        const productDetails = new TextDisplayBuilder()
                                            .setContent(`**Product:** ${thread.productName}\n**Payment Method:** ${thread.paymentMethod}\n**Description:** ${thread.notes || '-'}`);
                                        notifContainer.addTextDisplayComponents(productDetails)
                                            .addSeparatorComponents(notifSep);
                                    }

                                    const staffCount = new TextDisplayBuilder()
                                        .setContent(`• **Staff in Ticket:** ${thread.staffMembers?.length || 0}\n• **Staff Members:** ${staffMembersList.trim() || 'None'}`);

                                    notifContainer.addTextDisplayComponents(staffCount);

                                    const joinBtn = new ButtonBuilder()
                                        .setCustomId(`ticket_join_${thread.id}`)
                                        .setLabel('Join Ticket')
                                        .setStyle(ButtonStyle.Secondary);

                                    const notifButtonRow = new ActionRowBuilder()
                                        .addComponents(joinBtn);

                                    await notifMessage.edit({
                                        components: [notifContainer, notifButtonRow],
                                        flags: MessageFlags.IsComponentsV2,
                                    });
                                }
                            }
                        } catch (updateErr) {
                            console.error('[UPDATE NOTIF ERROR]', updateErr.message);
                        }
                    }

                    const successBlock = new ContainerBuilder()
                        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`✅ ${interaction.user} telah mengambil alih ticket ini!`)
                        );
                    await interaction.reply({
                        components: [successBlock],
                        flags: MessageFlags.IsComponentsV2,
                    });
                } else if (interaction.customId === 'ticket_add') {
                    return await handleTicketAddButton(interaction, client);
                } else if (interaction.customId === 'middleman_add') {
                    return await handleMiddlemanAddButton(interaction, client);
                } else if (interaction.customId === 'middleman_close') {
                    // Check jika user punya staff role
                    if (!interaction.member.roles.cache.has(config.staffRoleId)) {
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent('❌ Hanya staff yang bisa close request!')
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

                // Handle middleman_join button
                if (interaction.customId.startsWith('middleman_join_')) {
                    const requestId = interaction.customId.replace('middleman_join_', '');
                    
                    // Check jika user punya staff role
                    if (!interaction.member.roles.cache.has(config.staffRoleId)) {
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent('❌ Hanya staff yang bisa join request!')
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
                                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent('❌ Request tidak ditemukan!')
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
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`✅ <@${interaction.user.id}> telah join request!`)
                            );
                        await interaction.reply({
                            components: [successBlock],
                            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        });

                        // Update notification di staff channel
                        try {
                            const staffChannel = await client.channels.fetch(config.notificationChannelId);
                            if (staffChannel && request.notifMessageId) {
                                const notifMessage = await staffChannel.messages.fetch(request.notifMessageId).catch(() => null);
                                
                                if (notifMessage) {
                                    // Build staff members list
                                    let staffMembersList = '';
                                    if (request.staffMembers && request.staffMembers.length > 0) {
                                        for (const staffId of request.staffMembers) {
                                            staffMembersList += `<@${staffId}> `;
                                        }
                                    }

                                    // Get creator info
                                    let creatorAvatar = null;
                                    try {
                                        if (request.creatorId) {
                                            const creator = await client.users.fetch(request.creatorId);
                                            creatorAvatar = creator.displayAvatarURL({ size: 256, dynamic: true });
                                        }
                                    } catch (e) {}

                                    // Extract request ID from topic
                                    let requestId = 'N/A';
                                    if (request.topic) {
                                        const match = request.topic.match(/(?:Request|Ticket) ID: ([\w-]+)/);
                                        if (match) requestId = match[1];
                                    }

                                    const thumbnail = new ThumbnailBuilder({ media: { url: creatorAvatar || '' } });
                                    const notifTitle = new SectionBuilder()
                                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## **🤝 Join Request**\n\n**A Middleman Request is Opened!**`))
                                        .setThumbnailAccessory(thumbnail);

                                    const requestDetails = new TextDisplayBuilder()
                                        .setContent(`• **Request ID:** ${requestId}\n• **Type:** Transaction\n• **Opened by:** <@${request.creatorId || '?'}>\n• **Claimed by:** ${request.claimedBy ? `<@${request.claimedBy}>` : 'Not claimed yet'}`);

                                    const buyerSellerInfo = new TextDisplayBuilder()
                                        .setContent(`• **Buyer/Seller:** <@${request.buyerSellerId || '?'}>\n• **Range:** ${request.range || 'N/A'}`);

                                    const staffCount = new TextDisplayBuilder()
                                        .setContent(`• **Staff in Request:** ${request.staffMembers?.length || 0}\n• **Staff Members:** ${staffMembersList.trim() || 'None'}`);

                                    const notifSep = new SeparatorBuilder();

                                    const notifContainer = new ContainerBuilder()
                                        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                                        .addSectionComponents(notifTitle)
                                        .addSeparatorComponents(notifSep)
                                        .addTextDisplayComponents(requestDetails)
                                        .addSeparatorComponents(notifSep)
                                        .addTextDisplayComponents(buyerSellerInfo)
                                        .addSeparatorComponents(notifSep)
                                        .addTextDisplayComponents(staffCount);

                                    const joinBtn = new ButtonBuilder()
                                        .setCustomId(`middleman_join_${requestId}`)
                                        .setLabel('Join Request')
                                        .setStyle(ButtonStyle.Secondary);

                                    const notifButtonRow = new ActionRowBuilder()
                                        .addComponents(joinBtn);

                                    await notifMessage.edit({
                                        components: [notifContainer, notifButtonRow],
                                        flags: MessageFlags.IsComponentsV2,
                                    });
                                }
                            }
                        } catch (updateErr) {
                            console.error('[UPDATE NOTIF ERROR]', updateErr.message);
                        }

                        console.log(`[MIDDLEMAN] Staff ${interaction.user.tag} joined request. Total staff: ${request.staffMembers?.length || 0}`);
                    } catch (err) {
                        console.error('[MIDDLEMAN JOIN ERROR]', err.message);
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent('❌ Gagal join request!')
                            );
                        await interaction.reply({
                            components: [errorBlock],
                            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        });
                    }
                    return;
                }

                // Handle middleman_claim button
                if (interaction.customId === 'middleman_claim') {
                    // Check jika user punya staff role
                    if (!interaction.member.roles.cache.has(config.staffRoleId)) {
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent('❌ Hanya staff yang bisa claim request!')
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
                            const staffChannel = await client.channels.fetch(config.notificationChannelId);
                            if (staffChannel && request.notifMessageId) {
                                const notifMessage = await staffChannel.messages.fetch(request.notifMessageId).catch(() => null);
                                
                                if (notifMessage) {
                                    // Build staff members list
                                    let staffMembersList = '';
                                    if (request.staffMembers && request.staffMembers.length > 0) {
                                        for (const staffId of request.staffMembers) {
                                            staffMembersList += `<@${staffId}> `;
                                        }
                                    }

                                    // Get creator info
                                    let creatorAvatar = null;
                                    try {
                                        if (request.creatorId) {
                                            const creator = await client.users.fetch(request.creatorId);
                                            creatorAvatar = creator.displayAvatarURL({ size: 256, dynamic: true });
                                        }
                                    } catch (e) {}

                                    // Extract request ID from topic
                                    let requestId = 'N/A';
                                    if (request.topic) {
                                        const match = request.topic.match(/(?:Request|Ticket) ID: ([\w-]+)/);
                                        if (match) requestId = match[1];
                                    }

                                    const thumbnail = new ThumbnailBuilder({ media: { url: creatorAvatar || '' } });
                                    const notifTitle = new SectionBuilder()
                                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## **🤝 Join Request**\n\n**A Middleman Request is Opened!**`))
                                        .setThumbnailAccessory(thumbnail);

                                    const basicInfo = new TextDisplayBuilder()
                                        .setContent(`• **Request ID:** ${requestId}\n• **Opened by:** <@${request.creatorId || '?'}>\n• **Claimed by:** <@${interaction.user.id}>`);

                                    const buyerSellerInfo = new TextDisplayBuilder()
                                        .setContent(`• **Buyer/Seller:** <@${request.buyerSellerId || '?'}>\n• **Range:** ${request.range || 'N/A'}`);

                                    const notifSep = new SeparatorBuilder();

                                    const notifContainer = new ContainerBuilder()
                                        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                                        .addSectionComponents(notifTitle)
                                        .addSeparatorComponents(notifSep)
                                        .addTextDisplayComponents(basicInfo)
                                        .addSeparatorComponents(notifSep)
                                        .addTextDisplayComponents(buyerSellerInfo)
                                        .addSeparatorComponents(notifSep);

                                    const staffCount = new TextDisplayBuilder()
                                        .setContent(`• **Staff in Request:** ${request.staffMembers?.length || 0}\n• **Staff Members:** ${staffMembersList.trim() || 'None'}`);

                                    notifContainer.addTextDisplayComponents(staffCount);

                                    const joinBtn = new ButtonBuilder()
                                        .setCustomId(`middleman_join_${request.id}`)
                                        .setLabel('Join Request')
                                        .setStyle(ButtonStyle.Secondary);

                                    const notifButtonRow = new ActionRowBuilder()
                                        .addComponents(joinBtn);

                                    await notifMessage.edit({
                                        components: [notifContainer, notifButtonRow],
                                        flags: MessageFlags.IsComponentsV2,
                                    });
                                }
                            }
                        } catch (updateErr) {
                            console.error('[UPDATE NOTIF ERROR]', updateErr.message);
                        }
                    }

                    const successBlock = new ContainerBuilder()
                        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`✅ ${interaction.user} telah mengambil alih request ini!`)
                        );
                    await interaction.reply({
                        components: [successBlock],
                        flags: MessageFlags.IsComponentsV2,
                    });
                }
            }

            // Handle close ticket modal submission
            if (interaction.isModalSubmit()) {
                if (interaction.customId === 'review_form_modal') {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                    try {
                        const reviewChannelId = config.reviewChannelId || '1409205898634723409';
                        const reviewChannel = await client.channels.fetch(reviewChannelId).catch(() => null);

                        if (!reviewChannel) {
                            const errorBlock = new ContainerBuilder()
                                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent('❌ Review channel tidak ditemukan!')
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
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
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
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`✅ **Terima kasih atas review kamu!**\n\nReview kamu telah dikirim dan akan ditampilkan di channel review.`)
                            );

                        await interaction.editReply({
                            components: [successBlock],
                            flags: MessageFlags.IsComponentsV2,
                        });

                        console.log(`[REVIEW] Review submitted by ${username} - Rating: ${validRating}/5`);
                    } catch (error) {
                        console.error('[REVIEW SUBMIT ERROR]', error.message);
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
                            );
                        await interaction.editReply({
                            components: [errorBlock],
                            flags: MessageFlags.IsComponentsV2,
                        });
                    }
                } else if (interaction.customId === 'purchase_form_modal') {
                    return await handlePurchaseFormModal(interaction, client);
                } else if (interaction.customId === 'close_ticket_modal') {
                    const channel = interaction.channel;
                    const reason = interaction.fields.getTextInputValue('close_reason') || 'No reason provided';

                    if (channel && (channel.name.includes('purchase') || channel.name.includes('help') || channel.name.includes('midman'))) {
                        try {
                            // Extract ticket ID from topic or use N/A
                            let ticketId = 'N/A';
                            if (channel.topic && channel.topic.includes('Request ID:')) {
                                ticketId = channel.topic.replace('Request ID: ', '').trim();
                            } else if (channel.topic && channel.topic.includes('Ticket ID:')) {
                                ticketId = channel.topic.replace('Ticket ID: ', '').trim();
                            }

                            const openedBy = channel.creatorId ? `<@${channel.creatorId}>` : 'Unknown';
                            const closedBy = `<@${interaction.user.id}>`;
                            const claimedBy = channel.claimedBy ? `<@${channel.claimedBy}>` : 'Not claimed';
                            const openTime = `<t:${Math.floor(channel.createdTimestamp / 1000)}:f>`;
                            const closedTime = `<t:${Math.floor(Date.now() / 1000)}:t>`;

                            const title = new TextDisplayBuilder()
                                .setContent(`## 🔒 Ticket Closed`);

                            const ticketInfo = new TextDisplayBuilder()
                                .setContent(`• **Ticket ID:** ${ticketId}\n• **Opened By:** ${openedBy}\n• **Closed By:** ${closedBy}`);

                            const timeInfo = new TextDisplayBuilder()
                                .setContent(`• **Open Time:** ${openTime}\n• **Claimed By:** ${claimedBy}`);

                            const reasonInfo = new TextDisplayBuilder()
                                .setContent(`• **Reason:** ${reason}\n\n${closedTime}`);

                            const sep = new SeparatorBuilder();

                            const closingContainer = new ContainerBuilder()
                                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                                .addTextDisplayComponents(title)
                                .addSeparatorComponents(sep)
                                .addTextDisplayComponents(ticketInfo)
                                .addSeparatorComponents(sep)
                                .addTextDisplayComponents(timeInfo)
                                .addSeparatorComponents(sep)
                                .addTextDisplayComponents(reasonInfo);

                            await channel.send({
                                components: [closingContainer],
                                flags: MessageFlags.IsComponentsV2,
                            });

                            // Acknowledge the modal submission
                            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                            // Send transcript to archive channel
                            try {
                                const transcriptChannel = await client.channels.fetch('1408945335220437063').catch(() => null);
                                if (transcriptChannel) {
                                    // Build transcript header with Components v2
                                    const ticketType = channel.name.includes('purchase') ? 'Purchase' : channel.name.includes('midman') ? 'Middleman' : 'Help';
                                    
                                    const transcriptTitle = new TextDisplayBuilder()
                                        .setContent(`## 📋 Ticket Closed - Transcript\n\n**${ticketType} Ticket**`);

                                    const ticketDetails = new TextDisplayBuilder()
                                        .setContent(`• **Ticket ID:** ${ticketId}\n• **Opened By:** <@${channel.creatorId}>\n• **Closed By:** <@${interaction.user.id}>`);

                                    const ticketMeta = new TextDisplayBuilder()
                                        .setContent(`• **Open Time:** ${openTime}\n• **Claimed By:** ${claimedBy}\n• **Reason:** ${reason}`);

                                    const sep = new SeparatorBuilder();

                                    const transcriptHeaderContainer = new ContainerBuilder()
                                        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                                        .addTextDisplayComponents(transcriptTitle)
                                        .addSeparatorComponents(sep)
                                        .addTextDisplayComponents(ticketDetails)
                                        .addSeparatorComponents(sep)
                                        .addTextDisplayComponents(ticketMeta);

                                    const viewThreadBtn = new ButtonBuilder()
                                        .setLabel('View Thread')
                                        .setStyle(ButtonStyle.Link)
                                        .setURL(`https://discord.com/channels/${channel.guildId}/${channel.id}`);

                                    const buttonRow = new ActionRowBuilder()
                                        .addComponents(viewThreadBtn);

                                    await transcriptChannel.send({
                                        components: [transcriptHeaderContainer, buttonRow],
                                        flags: MessageFlags.IsComponentsV2,
                                    });

                                    // Fetch all messages from thread
                                    const messages = await channel.messages.fetch({ limit: 100 });
                                    const sortedMessages = Array.from(messages.values()).reverse();

                                    // Build message transcript
                                    let messageTranscript = ``;

                                    for (const msg of sortedMessages) {
                                        // Skip bot messages and messages with no content
                                        if (msg.author.bot || !msg.content) continue;

                                        const author = msg.author.tag;
                                        const content = msg.content;
                                        const time = `<t:${Math.floor(msg.createdTimestamp / 1000)}:t>`;
                                        messageTranscript += `**${author}** - ${time}\n${content}\n\n`;
                                    }

                                    // Split transcript if too long
                                    const chunks = messageTranscript.match(/[\s\S]{1,2000}/g) || [];
                                    
                                    for (let i = 0; i < chunks.length; i++) {
                                        const messageContainer = new ContainerBuilder()
                                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                                            .addTextDisplayComponents(
                                                new TextDisplayBuilder().setContent(chunks[i])
                                            );
                                        
                                        await transcriptChannel.send({
                                            components: [messageContainer],
                                            flags: MessageFlags.IsComponentsV2,
                                        });
                                    }


                                    console.log(`[TRANSCRIPT] Ticket ${channel.name} transcript saved - ${chunks.length} messages`);
                                }
                            } catch (transcriptErr) {
                                console.error('[TRANSCRIPT ERROR]', transcriptErr.message);
                            }

                            // Lock and archive thread after 3 seconds
                            setTimeout(async () => {
                                try {
                                    // Lock the thread first
                                    await channel.setLocked(true, `Locked by ${interaction.user.tag}`);
                                    // Then archive it
                                    await channel.setArchived(true, `Closed by ${interaction.user.tag} - Reason: ${reason}`);
                                } catch (lockErr) {
                                    console.error('[LOCK THREAD ERROR]', lockErr.message);
                                }
                            }, 3000);

                            console.log(`[TICKETS] Ticket ${channel.name} locked and archived by ${interaction.user.tag} - Reason: ${reason}`);
                        } catch (err) {
                            console.error('[CLOSE TICKET ERROR]', err.message);
                            const errorBlock = new ContainerBuilder()
                                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent('❌ Gagal menutup ticket!')
                                );
                            await interaction.reply({
                                components: [errorBlock],
                                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                            });
                        }
                    } else {
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent('❌ Hanya bisa digunakan di ticket channel!')
                            );
                        await interaction.reply({
                            components: [errorBlock],
                            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        });
                    }
                    return;
                }
            }

            // Handle user select menu untuk add member
            if (interaction.isUserSelectMenu()) {
                if (interaction.customId === 'ticket_add_user') {
                    const selectedUserId = interaction.values[0];
                    const thread = interaction.channel;

                    if (!thread || !thread.isThread()) {
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
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
                                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
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
                                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
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
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`✅ User berhasil ditambahkan ke ticket!`)
                            );
                        await interaction.reply({
                            components: [successBlock],
                            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        });

                        console.log(`[TICKETS] User ${selectedUserId} added to ticket ${thread.name}`);
                    } catch (err) {
                        console.error('[ADD MEMBER ERROR]', err.message);
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`❌ Gagal menambahkan user!\n\n**Error:** ${err.message}`)
                            );
                        await interaction.reply({
                            components: [errorBlock],
                            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        });
                    }
                } else if (interaction.customId === 'middleman_add_user') {
                    const selectedUserId = interaction.values[0];
                    const thread = interaction.channel;

                    if (!thread || !thread.isThread()) {
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent('❌ Hanya bisa digunakan di middleman request!')
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
                                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
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
                                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
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
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`✅ Pembeli/Penjual berhasil ditambahkan ke request!`)
                            );
                        await interaction.reply({
                            components: [successBlock],
                            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        });

                        console.log(`[MIDDLEMAN] User ${selectedUserId} added to request ${thread.name}`);
                    } catch (err) {
                        console.error('[MIDDLEMAN ADD MEMBER ERROR]', err.message);
                        const errorBlock = new ContainerBuilder()
                            .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`❌ Gagal menambahkan user!\n\n**Error:** ${err.message}`)
                            );
                        await interaction.reply({
                            components: [errorBlock],
                            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                        });
                    }
                }
            }

        } catch (err) {
            console.error('[INTERACTION ERROR]', err);

            if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('An unexpected error occurred while handling this interaction.')
                    );

                interaction.reply({
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                    components: [errorBlock],
                }).catch(console.error);
            }
        }
    }
};

