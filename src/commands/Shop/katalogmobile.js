const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const { create_main_catalog_embed } = require('../../shared/catalog/catalog_controller');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('katalogmobile')
    .setDescription('View mobile game cheats catalog'),

  /**
   * Run katalogmobile command
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').Interaction} interaction
   * @return {Promise<void>}
   */
  async run(_client, interaction) {
    // - DEFER REPLY - \\
    await interaction.deferReply();

    try {
      // - GET CATALOG EMBED - \\
      console.log('[CATALOG] Creating catalog embed...');
      const result = create_main_catalog_embed();

      if (!result) {
        throw new Error('create_main_catalog_embed returned null');
      }

      const { container, select_row } = result;

      console.log('[CATALOG] Embed created, sending reply...');

      // - SEND REPLY - \\
      await interaction.editReply({
        components : [container, select_row],
        flags      : MessageFlags.IsComponentsV2
      });

      console.log(`[CATALOG] ${interaction.user.tag} viewed mobile catalog`);
    } catch (error) {
      console.error('[CATALOG ERROR]', error.message);
      console.error('[CATALOG ERROR STACK]', error.stack);

      // - SEND ERROR MESSAGE - \\
      const error_container = new ContainerBuilder()
        .setAccentColor(0xFF0000)
        .addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent(`❌ Failed to load catalog.\n\n**Error:** \`${error.message}\`\n\nPlease try again later.`)
        );

      await interaction.editReply({
        components : [error_container],
        flags      : MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }
  }
};
