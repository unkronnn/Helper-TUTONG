const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const { create_main_bypass_catalog_embed } = require('../../shared/catalog/bypass_val_controller');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bypassval')
    .setDescription('View Valorant bypass services catalog'),

  /**
   * Run bypassval command
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').Interaction} interaction
   * @return {Promise<void>}
   */
  async run(_client, interaction) {
    // - DEFER REPLY - \\
    await interaction.deferReply();

    try {
      // - GET BYPASS CATALOG EMBED - \\
      console.log('[BYPASS VAL] Creating bypass catalog embed...');
      const container = create_main_bypass_catalog_embed();

      if (!container) {
        throw new Error('create_main_bypass_catalog_embed returned null');
      }

      console.log('[BYPASS VAL] Embed created, sending reply...');

      // - SEND REPLY - \\
      await interaction.editReply({
        components : [container],
        flags      : MessageFlags.IsComponentsV2
      });

      console.log(`[BYPASS VAL] ${interaction.user.tag} viewed bypass catalog`);
    } catch (error) {
      console.error('[BYPASS VAL ERROR]', error.message);
      console.error('[BYPASS VAL ERROR STACK]', error.stack);

      // - SEND ERROR MESSAGE - \\
      const error_container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent(`❌ Failed to load bypass catalog.\n\n**Error:** \`${error.message}\`\n\nPlease try again later.`)
        );

      await interaction.editReply({
        components : [error_container],
        flags      : MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }
  }
};
