const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');
const { Warning } = require('../../database/mongodb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delwarn')
    .setDescription('Remove specific warning from user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to remove warning from')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('warning_number')
        .setDescription('Warning number to remove')
        .setRequired(true)
        .setMinValue(1)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const targetUser = interaction.options.getUser('user');
    const warningNumber = interaction.options.getInteger('warning_number');
    const guild = interaction.guild;

    try {
      // Check if user has permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Kamu tidak memiliki permission untuk delete warns');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Fetch warnings from database
      const warningDoc = await Warning.findOne({
        userId: targetUser.id,
        guildId: guild.id
      });

      if (!warningDoc || warningDoc.warnings.length === 0) {
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

      // Check if warning number is valid
      if (warningNumber < 1 || warningNumber > warningDoc.warnings.length) {
        const errorText = new TextDisplayBuilder()
          .setContent(`❌ Warning nomor ${warningNumber} tidak ditemukan! (Total: ${warningDoc.warnings.length})`);

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Get the warning that will be deleted
      const deletedWarning = warningDoc.warnings[warningNumber - 1];

      // Remove warning
      warningDoc.warnings.splice(warningNumber - 1, 1);
      await warningDoc.save();

      const successText = new TextDisplayBuilder()
        .setContent(
          `**WARNING DELETED**\n\n` +
          `Target: ${targetUser.username}\n` +
          `User ID: ${targetUser.id}\n` +
          `Deleted Warning #${warningNumber}\n` +
          `Reason: ${deletedWarning.reason}\n` +
          `Moderator: ${interaction.user.username}\n` +
          `Remaining Warnings: ${warningDoc.warnings.length}`
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
        .setContent('❌ Terjadi kesalahan saat menghapus warning');

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
