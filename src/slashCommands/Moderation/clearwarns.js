const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');
const { Warning } = require('../../database/mongodb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Hapus semua warning seorang user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User yang warning-nya akan dihapus')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const targetUser = interaction.options.getUser('user');
    const guild = interaction.guild;

    try {
      // Check if user has permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Kamu tidak memiliki permission untuk clear warns');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Fetch and delete warnings
      const warningDoc = await Warning.findOneAndUpdate(
        {
          userId: targetUser.id,
          guildId: guild.id
        },
        {
          warnings: []
        },
        { new: true }
      );

      if (!warningDoc) {
        const noWarnText = new TextDisplayBuilder()
          .setContent(`✅ ${targetUser.username} tidak memiliki warning apapun!`);

        const noWarnContainer = new ContainerBuilder()
          .setAccentColor(0x00FF00)
          .addTextDisplayComponents(noWarnText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [noWarnContainer],
        });
      }

      const successText = new TextDisplayBuilder()
        .setContent(
          `**WARNINGS CLEARED**\n\n` +
          `Target: ${targetUser.username}\n` +
          `User ID: ${targetUser.id}\n` +
          `Moderator: ${interaction.user.username}`
        );

      const successContainer = new ContainerBuilder()
        .setAccentColor(parseInt(config.color, 16))
        .addTextDisplayComponents(successText);

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [successContainer],
      });
    } catch (error) {
      console.error(error);
      const errorText = new TextDisplayBuilder()
        .setContent('❌ Terjadi kesalahan saat menghapus warnings');

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
