const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { get_all_bypass_services, create_bypass_service_detail_embed } = require('../../shared/catalog/bypass_val_controller');

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
      // - SEND PERMANENT PANEL WITH ALL SERVICES - \\
      console.log('[BYPASS VAL] Creating bypass panel...');

      const services = get_all_bypass_services();

      // Header
      const header_text = new TextDisplayBuilder()
        .setContent('**VALORANT BYPASS SERVICES**\n\nSelect a service to view details:');

      const separator1 = new SeparatorBuilder();

      // Services list
      let services_display = '**Available Services:**\n\n';
      services.forEach(service => {
        services_display += `${service.emoji} **${service.name}**\n`;
        services_display += `└ ${service.description}\n\n`;
      });

      const services_text = new TextDisplayBuilder()
        .setContent(services_display);

      const separator2 = new SeparatorBuilder();

      // Build main panel container
      const mainPanel = new ContainerBuilder()
        .addTextDisplayComponents(header_text)
        .addSeparatorComponents(separator1)
        .addTextDisplayComponents(services_text)
        .addSeparatorComponents(separator2);

      console.log('[BYPASS VAL] Sending bypass panel...');

      // - SEND MAIN PANEL - \\
      await interaction.editReply({
        components : [mainPanel],
        flags      : MessageFlags.IsComponentsV2
      });

      // - SEND SERVICE DETAIL EMBEDS (PUBLIC) - \\
      // Send INSOLENCE embed
      const insolenceEmbed = create_bypass_service_detail_embed('insolence');
      await interaction.followUp({
        components : [insolenceEmbed],
        flags      : MessageFlags.IsComponentsV2
      });

      // Send DRASKOVIC embed
      const draskovicEmbed = create_bypass_service_detail_embed('draskovic');
      await interaction.followUp({
        components : [draskovicEmbed],
        flags      : MessageFlags.IsComponentsV2
      });

      console.log(`[BYPASS VAL] ${interaction.user.tag} viewed bypass panel`);
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
