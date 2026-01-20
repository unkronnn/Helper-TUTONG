// src/slashCommands/Moderation/mute.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to mute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('Mute duration (example: 1h, 30m, 1d)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for mute (optional')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const targetUser = interaction.options.getUser('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guild = interaction.guild;

    try {
      // Check if user has permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Kamu tidak memiliki permission untuk mute member');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Check if bot can mute
      if (!guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Bot tidak memiliki permission untuk mute member');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Get target member
      const targetMember = await guild.members.fetch(targetUser.id);

      // Cannot mute yourself
      if (targetUser.id === interaction.user.id) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Kamu tidak bisa mute dirimu sendiri');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Check role hierarchy
      const botMember = guild.members.me;
      if (botMember.roles.highest.position <= targetMember.roles.highest.position) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Bot role harus lebih tinggi dari target member');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Parse duration
      const duration = parseDuration(durationStr);
      if (!duration) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Format durasi tidak valid (contoh: 1h, 30m, 1d)');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      await targetMember.timeout(duration, reason);

      // Send DM to user
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0xFFAA00)
          .setTitle('Muted')
          .setDescription(`You have been muted on **${guild.name}** for **${durationStr}**.`)
          .addFields(
            { name: 'Duration', value: durationStr, inline: true },
            { name: 'Reason', value: reason || 'No reason provided', inline: true },
            { name: '', value: '', inline: false }
          )
          .setFooter({ text: `Moderator: ${interaction.user.username}` })
          .setTimestamp();

        await targetUser.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        logger.info(`Could not DM ${targetUser.username}`);
      }

      const successText = new TextDisplayBuilder()
        .setContent(
          `## :white_check_mark: User muted.\n\n` +
          `Target: ${targetUser.username}\n` +
          `Duration: ${durationStr}\n` +
          `Reason: ${reason}\n` +
          `Moderator: ${interaction.user.username}`
        );

      const successContainer = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16))
        .addTextDisplayComponents(successText);

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [successContainer],
      });
    } catch (error) {
      console.error(error);
      
      let errorMessage = '❌ Terjadi kesalahan saat mute user';
      
      if (error.code === 50013) {
        errorMessage = '❌ Bot tidak memiliki permission yang cukup (pastikan bot role lebih tinggi)';
      }

      const errorText = new TextDisplayBuilder()
        .setContent(errorMessage);

      const errorContainer = new ContainerBuilder()
        .setAccentColor(0xFF0000)
        .addTextDisplayComponents(errorText);

      return interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer],
      });
    }
  }
};

function parseDuration(str) {
  const regex = /^(\d+)([smhd])$/i;
  const match = str.match(regex);

  if (!match) return null;

  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000
  };

  return amount * multipliers[unit];
}


