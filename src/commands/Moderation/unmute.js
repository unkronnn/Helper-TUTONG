// src/slashCommands/Moderation/unmute.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to unmute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for unmute (optional')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guild = interaction.guild;

    try {
      // Check if user has permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Kamu tidak memiliki permission untuk unmute member');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Check if bot can mute
      if (!guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Bot tidak memiliki permission untuk unmute member');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Get target member
      const targetMember = await guild.members.fetch(targetUser.id);

      // Check if member is actually muted
      if (!targetMember.communicationDisabledUntil) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ User ini tidak sedang di-mute');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      await targetMember.timeout(null, reason);

      // Send DM to user
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('Unmuted')
          .setDescription(`Your mute has been lifted on **${guild.name}**. You can now speak.`)
          .addFields(
            { name: 'Reason', value: reason || 'Timeout expired', inline: false }
          )
          .setFooter({ text: `Moderator: ${interaction.user.username}` })
          .setTimestamp();

        await targetUser.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        logger.info(`Could not DM ${targetUser.username}`);
      }

      const successEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('User Unmuted')
        .setDescription('Your voice has been restored.')
        .addFields(
          { name: 'User', value: `<@${targetUser.id}>`, inline: false },
          { name: 'Unmuted by', value: `<@${interaction.user.id}>`, inline: false },
          { name: 'Reason', value: reason || 'No reason provided', inline: false }
        );

      await interaction.reply({
        embeds: [successEmbed],
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription('❌ Terjadi kesalahan saat unmute user');

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }
  }
};


