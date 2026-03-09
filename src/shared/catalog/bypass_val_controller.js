/**
 * Bypass Valorant Controller
 * Handles Valorant bypass service embed creation
 */

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder
} = require('discord.js');

const {
  get_all_bypass_services,
  get_bypass_service_by_id
} = require('./bypass_val_data.js');

/**
 * Create main bypass catalog embed with service list
 * @return {ContainerBuilder} Container with service list
 */
function create_main_bypass_catalog_embed() {
  const services = get_all_bypass_services();

  // Header
  const header_text = new TextDisplayBuilder()
    .setContent('**VALORANT BYPASS SERVICES**\n\nSelect a bypass service to view details:');

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

  // Service select dropdown
  const select_options = services.map(service => ({
    label     : service.name,
    value     : `bypass-${service.id}`,
    description: service.description
  }));

  const service_select = new StringSelectMenuBuilder()
    .setCustomId('bypass_service_select')
    .setPlaceholder('Select a bypass service')
    .addOptions(select_options);

  const select_row = new ActionRowBuilder()
    .addComponents(service_select);

  // Build container
  const container = new ContainerBuilder()
    .addTextDisplayComponents(header_text)
    .addSeparatorComponents(separator1)
    .addTextDisplayComponents(services_text)
    .addSeparatorComponents(separator2)
    .addActionRowComponents(select_row);

  return container;
}

/**
 * Create service detail embed
 * @param {string} service_id
 * @return {ContainerBuilder} Container with service details
 */
function create_bypass_service_detail_embed(service_id) {
  const service = get_bypass_service_by_id(service_id);

  if (!service) {
    const error_text = new TextDisplayBuilder()
      .setContent('❌ **Error:** Service not found.');

    return new ContainerBuilder().addTextDisplayComponents(error_text);
  }

  // Header
  const header_text = new TextDisplayBuilder()
    .setContent(`${service.emoji} **${service.name}**\n*${service.description}*`);

  const separator1 = new SeparatorBuilder();

  // Features
  let features_display = '**Features:**\n\n';
  if (service.features && service.features.length > 0) {
    features_display += service.features.join('\n');
  }

  const features_text = new TextDisplayBuilder()
    .setContent(features_display);

  const separator2 = new SeparatorBuilder();

  // System requirements
  let system_display = '**System Requirements:**\n\n';
  if (service.system) {
    system_display += `**Processors:** ${service.system.processors}\n`;
    system_display += `**OS:** ${service.system.os}\n`;
  }

  const system_text = new TextDisplayBuilder()
    .setContent(system_display);

  const separator3 = new SeparatorBuilder();

  // Highlights
  let highlights_display = '';
  if (service.highlights && service.highlights.length > 0) {
    highlights_display = '**Highlights:**\n\n';
    service.highlights.forEach(highlight => {
      highlights_display += `• ${highlight}\n`;
    });
  }

  let highlights_text = null;
  if (highlights_display) {
    highlights_text = new TextDisplayBuilder()
      .setContent(highlights_display);
  }

  const separator4 = highlights_text ? new SeparatorBuilder() : null;

  // Pricing
  let pricing_display = '**Pricing:**\n\n';
  if (service.prices && service.prices.length > 0) {
    service.prices.forEach(price => {
      pricing_display += `**${price.duration}**\n`;
      pricing_display += `└ ${price.price_idr} / ${price.price_usd}\n\n`;
    });
  }

  const pricing_text = new TextDisplayBuilder()
    .setContent(pricing_display);

  const separator5 = new SeparatorBuilder();

  // Buy Now button
  const buy_button = new ButtonBuilder()
    .setLabel('Buy Now')
    .setURL('https://discord.com/channels/1338437118296330292/1473664373980528640')
    .setStyle(5); // Link

  // Back button
  const back_button = new ButtonBuilder()
    .setCustomId('bypass_catalog_back')
    .setLabel('Back to Services')
    .setStyle(1); // Primary

  const button_row = new ActionRowBuilder()
    .addComponents(buy_button, back_button);

  // Build container
  const container = new ContainerBuilder()
    .addTextDisplayComponents(header_text)
    .addSeparatorComponents(separator1)
    .addTextDisplayComponents(features_text)
    .addSeparatorComponents(separator2)
    .addTextDisplayComponents(system_text)
    .addSeparatorComponents(separator3);

  if (highlights_text && separator4) {
    container.addTextDisplayComponents(highlights_text);
    container.addSeparatorComponents(separator4);
  }

  container.addTextDisplayComponents(pricing_text);
  container.addSeparatorComponents(separator5);
  container.addActionRowComponents(button_row);

  return container;
}

module.exports = {
  create_main_bypass_catalog_embed,
  create_bypass_service_detail_embed
};
