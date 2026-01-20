const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('undeafen')
    .setDescription('Undeafen a user (can hear audio again)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to undeafen')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const targetUser = interaction.options.getUser('user');
    const guild = interaction.guild;

    try {
      // Check if user has permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.DeafenMembers)) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Kamu tidak memiliki permission untuk undeafen member');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Check if bot can deafen
      if (!guild.members.me.permissions.has(PermissionFlagsBits.DeafenMembers)) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Bot tidak memiliki permission untuk undeafen member');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Cannot undeafen yourself
      if (targetUser.id === interaction.user.id) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Kamu tidak bisa undeafen dirimu sendiri');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      const targetMember = await guild.members.fetch(targetUser.id);

      // Check if member is in voice
      if (!targetMember.voice.channel) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Member tidak berada di voice channel');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      await targetMember.voice.setDeaf(false);

      const successText = new TextDisplayBuilder()
        .setContent(
          `**UNDEAFENED**\n\n` +
          `Target: ${targetUser.username}\n` +
          `User ID: ${targetUser.id}\n` +
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
      const errorText = new TextDisplayBuilder()
        .setContent('❌ Terjadi kesalahan saat men-undeafen member');

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
