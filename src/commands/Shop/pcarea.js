const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const { create_main_pc_catalog_embed } = require('../../shared/catalog/pc_catalog_controller');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pcarea')
    .setDescription('View PC game cheats catalog'),

  /**
   * Run pcarea command
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').Interaction} interaction
   * @return {Promise<void>}
   */
  async run(_client, interaction) {
    // - DEFER REPLY - \\
    await interaction.deferReply();

    try {
      // - GET PC CATALOG EMBED - \\
      console.log('[PC CATALOG] Creating PC catalog embed...');
      const container = create_main_pc_catalog_embed();

      if (!container) {
        throw new Error('create_main_pc_catalog_embed returned null');
      }

      console.log('[PC CATALOG] Embed created, sending reply...');

      // - SEND REPLY - \\
      await interaction.editReply({
        components : [container],
        flags      : MessageFlags.IsComponentsV2
      });

      console.log(`[PC CATALOG] ${interaction.user.tag} viewed PC catalog`);
    } catch (error) {
      console.error('[PC CATALOG ERROR]', error.message);
      console.error('[PC CATALOG ERROR STACK]', error.stack);

      // - SEND ERROR MESSAGE - \\
      const error_container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent(`❌ Failed to load PC catalog.\n\n**Error:** \`${error.message}\`\n\nPlease try again later.`)
        );

      await interaction.editReply({
        components : [error_container],
        flags      : MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }
  }
};
