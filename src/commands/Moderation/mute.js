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
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Kamu tidak memiliki permission untuk mute member');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Check if bot can mute
      if (!guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Bot tidak memiliki permission untuk mute member');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Get target member
      const targetMember = await guild.members.fetch(targetUser.id);

      // Cannot mute yourself
      if (targetUser.id === interaction.user.id) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Kamu tidak bisa mute dirimu sendiri');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Check role hierarchy
      const botMember = guild.members.me;
      if (botMember.roles.highest.position <= targetMember.roles.highest.position) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Bot role harus lebih tinggi dari target member');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Parse duration
      const duration = parseDuration(durationStr);
      if (!duration) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Format durasi tidak valid (contoh: 1h, 30m, 1d)');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
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

      const successEmbed = new EmbedBuilder()
        .setColor(0xFFAA00)
        .setTitle('User Muted')
        .setDescription('Silence has been enforced.')
        .addFields(
          { name: 'User', value: `<@${targetUser.id}>`, inline: false },
          { name: 'Muted by', value: `<@${interaction.user.id}>`, inline: false },
          { name: 'Duration', value: durationStr, inline: false },
          { name: 'Reason', value: reason || 'No reason provided', inline: false }
        );

      await interaction.reply({
        embeds: [successEmbed],
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      
      let errorMessage = '❌ Terjadi kesalahan saat mute user';
      
      if (error.code === 50013) {
        errorMessage = '❌ Bot tidak memiliki permission yang cukup (pastikan bot role lebih tinggi)';
      }

      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription(errorMessage);

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
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


