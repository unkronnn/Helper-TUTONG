const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags, SeparatorBuilder, SectionBuilder, ThumbnailBuilder } = require('discord.js');
const config = require('../../config/config.json');
const { Warning } = require('../../database/mongodb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnlogs')
    .setDescription('View warning history of a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to view warning history for')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const targetUser = interaction.options.getUser('user');
    const guild = interaction.guild;

    try {
      // Check if user has permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Kamu tidak memiliki permission untuk melihat warn logs');

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

      // Build Components V2 response
      const headerText = new TextDisplayBuilder()
        .setContent(`# ⚠️ **Warning Logs**\n\nWarning history untuk ${targetUser.username}`);

      const headerSection = new SectionBuilder()
        .addTextDisplayComponents(headerText);
      
      // Only set thumbnail if avatar URL exists
      const userAvatarUrl = targetUser.displayAvatarURL({ dynamic: true, size: 512 });
      if (userAvatarUrl && userAvatarUrl.length > 0) {
        try {
          const thumbnail = new ThumbnailBuilder({ media: { url: userAvatarUrl } });
          headerSection.setThumbnailAccessory(thumbnail);
        } catch (err) {
          console.warn(`[WARNLOGS] Failed to create thumbnail: ${err.message}`);
        }
      }

      // Build warnings list
      let warningsText = `**Username:** ${targetUser.username}\n**User ID:** \`${targetUser.id}\`\n\n**Warnings:**\n`;
      warningDoc.warnings.forEach((warning, index) => {
        const warnDate = new Date(warning.timestamp);
        const formattedDate = warnDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        warningsText += `\n**#${index + 1}** - ${formattedDate}\n`;
        warningsText += `• **Reason:** ${warning.reason}\n`;
        warningsText += `• **Moderator:** ${warning.moderator}\n`;
      });

      warningsText += `\n**Total Warnings:** ${warningDoc.warnings.length}`;

      const detailsText = new TextDisplayBuilder()
        .setContent(warningsText);

      const sep = new SeparatorBuilder();
      const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor.replace('#', ''), 16))
        .addSeparatorComponents(sep)
        .addSectionComponents(headerSection)
        .addSeparatorComponents(sep)
        .addTextDisplayComponents(detailsText)
        .addSeparatorComponents(sep);

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      });
    } catch (error) {
      console.error(error);
      const errorText = new TextDisplayBuilder()
        .setContent('❌ Terjadi kesalahan saat mengambil warn logs');

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
