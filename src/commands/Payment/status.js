const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ButtonStyle, ContainerBuilder, TextDisplayBuilder, EmbedBuilder } = require('discord.js');
const { ButtonBuilder, ActionRowBuilder } = require('discord.js');
const config = require('../../config/config.json');
const logger = require('../../console/logger');
const fs = require('fs');
const path = require('path');

const statusFile = path.join(__dirname, '../../config/status.json');

const getStatus = () => {
  try {
    const data = fs.readFileSync(statusFile, 'utf8');
    const parsed = JSON.parse(data);
    logger.info('[STATUS] getStatus success:', parsed);
    return parsed;
  } catch (err) {
    console.error('[STATUS] getStatus error:', err.message);
    return { isOpen: true };
  }
};

const setStatus = (isOpen, updatedBy) => {
  try {
    logger.debug(`[STATUS] setStatus called: isOpen=${isOpen}, updatedBy=${updatedBy}`);
    const status = {
      isOpen,
      lastUpdated: new Date().toISOString(),
      updatedBy
    };
    const jsonStr = JSON.stringify(status, null, 2);
    logger.info('[STATUS] Writing to file:', jsonStr);
    fs.writeFileSync(statusFile, jsonStr, 'utf8');
    logger.info('[STATUS] File write success');
    return status;
  } catch (err) {
    console.error('[STATUS] setStatus error:', err.message);
    throw err;
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check or change shop status')
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Check current shop status')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Toggle shop status (open/closed)')
    ),

  async run(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    const status = getStatus();

    if (subcommand === 'check') {
      const isOpenStatus = status.isOpen;
      const title = isOpenStatus ? `WE ARE OPEN` : `🔒 We're Closed for Today!`;
      const description = isOpenStatus 
        ? `Yang mau nanya-nanya dulu, atau yang udah siap gas order, pintu selalu terbuka. Jangan ragu buat apa admin di tiket ya. Gas bikin tiket sekarang, mumpung antrean masih aman! 🔥`
        : `Toko tutup sebentar ya! Kita mau recharge energi dulu biar besok bisa gaspol lagi ngelayanin joki & orderan kalian. Pantengin terus info open-nya, jangan sampai kelewatan!`;
      
      const content = `# ${title}

<@&${config.roles.member}>

${description}`;

      // Add toggle button if user is staff/admin
      let response = {
        content: content
      };

      if (interaction.member.permissions.has(PermissionFlagsBits.Administrator) || interaction.member.roles.cache.has(config.roles.staff)) {
        const toggleBtn = new ButtonBuilder()
          .setCustomId('status_toggle_btn')
          .setLabel(isOpenStatus ? 'Close Store' : 'Open Store')
          .setStyle(isOpenStatus ? ButtonStyle.Danger : ButtonStyle.Success);

        const buttonRow = new ActionRowBuilder().addComponents(toggleBtn);
        response.components = [buttonRow];
      }

      return await interaction.reply(response);
    }

    if (subcommand === 'toggle') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        // Check if user has admin/staff role
        const isAdmin = interaction.member?.permissions?.has(PermissionFlagsBits.Administrator);
        const isStaff = interaction.member?.roles?.cache?.has(config.roles.staff);
        
        if (!isAdmin && !isStaff) {
          const errorBlock = new ContainerBuilder()
            .setAccentColor(parseInt(config.primaryColor, 16))
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent('❌ Hanya admin atau staff yang bisa toggle status toko!')
            );
          return await interaction.editReply({
            components: [errorBlock],
            flags: MessageFlags.IsComponentsV2,
          });
        }

        const newStatus = !status.isOpen;
        logger.info(`[STATUS] Toggling to ${newStatus ? 'OPEN' : 'CLOSED'} by ${interaction.user.tag}`);
        setStatus(newStatus, interaction.user.tag);

        // Update voice channel status
        try {
          const statusChannel = await interaction.client.channels.fetch(config.channels.statusVoice);
          if (statusChannel && statusChannel.isVoiceBased()) {
            const statusEmoji = newStatus ? '🟢' : '🔴';
            const statusText = newStatus ? 'OPEN' : 'CLOSED';
            await statusChannel.setName(`STATUS: ${statusEmoji} [${statusText}]`);
            logger.info(`[STATUS] Voice channel updated: STATUS: ${statusEmoji} [${statusText}]`);
          }
        } catch (err) {
          logger.error(`[STATUS] Failed to update voice channel: ${err.message}`);
        }

        const title = newStatus ? `# 🔓 We're Open For Today!` : `# 🔒 We're Closed for Today!`;
        const description = newStatus 
          ? `Toko sudah buka ya guys! Yang mau tanya-tanya, order, atau butuh Jasa Rekber, pintu tiket selalu terbuka. Jangan ragu buat chat admin di dalam tiket ya!`
          : `Toko tutup dulu ya guys! Admin mau istirahat dulu. Buat kalian yang tiketnya sudah terbuka atau transaksi yang lagi jalan, bakal tetap admin layanin sampai tuntas/kelar kok! Jadi nggak ditinggal gitu aja ya. Thank you, see you tomorrow! 😴`;

        // Kirim pesan ke channel #announcements
        try {
          const announcementChannel = await interaction.client.channels.fetch(config.channels.announcements);
          if (announcementChannel) {
            // Kirim pesan pertama: tag member
            await announcementChannel.send(`<@&${config.roles.member}>`);
            
            // Kirim pesan kedua: embed dengan styling
            const embedColor = newStatus ? 0x2ecc71 : 0xe74c3c; // Hijau untuk open, merah untuk closed
            const embed = new EmbedBuilder()
              .setTitle(title)
              .setDescription(description)
              .setColor(embedColor);
            
            await announcementChannel.send({ embeds: [embed] });
            logger.info('[STATUS] Announcement sent');
          } else {
            logger.error('[STATUS] Announcement channel not found');
          }
        } catch (err) {
          logger.error('[STATUS] Failed to send announcement:', err.message);
        }

        // Reply ke user dengan ephemeral message
        logger.info('[STATUS] Sending reply...');
        const confirmBlock = new ContainerBuilder()
          .setAccentColor(parseInt(config.primaryColor, 16))
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`✅ Status berhasil diubah ke **${newStatus ? 'OPEN' : 'CLOSED'}**`)
          );

        await interaction.editReply({
          components: [confirmBlock],
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });

        logger.debug(`[STATUS] Store status toggled to ${newStatus ? 'OPEN' : 'CLOSED'} by ${interaction.user.tag}`);
      } catch (error) {
        logger.error('[STATUS] Error during toggle:', error.message);
        const errorBlock = new ContainerBuilder()
          .setAccentColor(parseInt(config.primaryColor, 16))
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
          );
        
        try {
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
          logger.error('[STATUS] Failed to send error reply:', replyErr.message);
        }
      }
    }
  }
};


