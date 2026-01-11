const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ButtonBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { MessageFlags, ButtonStyle } = require('discord.js');
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
    .setDescription('Check atau ubah status toko')
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Check status toko saat ini')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Toggle status toko (open/closed)')
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

<@&${config.memberRoleId}>

${description}`;

      // Add toggle button if user is staff/admin
      let response = {
        content: content
      };

      if (interaction.member.permissions.has(PermissionFlagsBits.Administrator) || interaction.member.roles.cache.has(config.staffRoleId)) {
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
      try {
        // Check if user has admin/staff role
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && !interaction.member.roles.cache.has(config.staffRoleId)) {
          const errorBlock = new ContainerBuilder()
            .setAccentColor(0xFF0000)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent('❌ Hanya admin atau staff yang bisa toggle status toko!')
            );
          return await interaction.reply({
            components: [errorBlock],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          });
        }

        const newStatus = !status.isOpen;
        logger.debug(`[STATUS] Current isOpen=${status.isOpen}, New isOpen=${newStatus}`);
        logger.info('[STATUS] Setting status...');
        setStatus(newStatus, interaction.user.tag);
        logger.info('[STATUS] Status set successfully');

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

        const title = newStatus ? `🔓 We're Open For Today! 🔓` : `🔒 We're Closed for Today! 🔒`;
        const description = newStatus 
          ? `Yang mau nanya-nanya dulu, atau yang udah siap gas order, pintu selalu terbuka. Jangan ragu buat apa admin di tiket ya. Gas bikin tiket sekarang, mumpung antrean masih aman! 🔥`
          : `Ticket system bakal kami lock setelah ini! buat yang sudah buka ticket akan tetap direspon sampai trx/kendala kamu selesai`;
        
        const content = `# ${title}

<@&${config.memberRoleId}>

${description}`;

        // Kirim pesan ke channel #general atau channel tertentu
        logger.info('[STATUS] Sending announcement...');
        try {
          const announcementChannel = await interaction.client.channels.fetch(config.announcementChannelId);
          if (announcementChannel) {
            await announcementChannel.send({ content: content });
            logger.info('[STATUS] Announcement sent');
          }
        } catch (err) {
          logger.error('[STATUS] Failed to send announcement:', err.message);
        }

        // Reply ke user dengan ephemeral message
        logger.info('[STATUS] Sending reply...');
        const confirmBlock = new ContainerBuilder()
          .setAccentColor(newStatus ? 0x20B2AA : 0xFF6B6B)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`✅ Status berhasil diubah ke **${newStatus ? 'OPEN' : 'CLOSED'}**`)
          );

        await interaction.reply({
          components: [confirmBlock],
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });

        logger.debug(`[STATUS] Store status toggled to ${newStatus ? 'OPEN' : 'CLOSED'} by ${interaction.user.tag}`);
      } catch (error) {
        console.error('[STATUS TOGGLE ERROR]', error.message);
        const errorBlock = new ContainerBuilder()
          .setAccentColor(0xFF0000)
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
          console.error('[STATUS REPLY ERROR]', replyErr.message);
        }
      }
    }
  }
};


