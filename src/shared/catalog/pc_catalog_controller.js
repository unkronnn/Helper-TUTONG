/**
 * PC Catalog Controller
 * Handles PC game catalog embed creation
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
  get_all_pc_games,
  get_pc_game_by_id,
  get_pc_cheat
} = require('./pc_catalog_data.js');

/**
 * Create main PC catalog embed with game list
 * @return {ContainerBuilder} Container with game list
 */
function create_main_pc_catalog_embed() {
  const games       = get_all_pc_games();
  const activeGames = games.filter(game => game.cheats && game.cheats.length > 0);

  // Header
  const header_text = new TextDisplayBuilder()
    .setContent('**🖥️ PC GAMES CATALOG**\n\nSelect a game to view available cheats:');

  const separator1 = new SeparatorBuilder();

  // Games list
  let games_display = '**Available Games:**\n\n';
  activeGames.forEach(game => {
    const cheatCount = game.cheats ? game.cheats.length : 0;
    games_display    += `${game.emoji} **${game.name}** - ${cheatCount} cheat${cheatCount > 1 ? 's' : ''}\n`;
  });

  const games_text = new TextDisplayBuilder()
    .setContent(games_display);

  const separator2 = new SeparatorBuilder();

  // Game select dropdown
  const select_options = activeGames.map(game => {
    // Extract emoji ID from custom emoji format <:name:id>
    const emojiId = game.emoji.match(/:(\d{18,19})/)?.[1] || undefined;
    return {
      label     : game.name,
      value     : `pcgame-${game.id}`,
      emoji     : emojiId,
      description: `${game.cheats.length} cheats available`
    };
  });

  const game_select = new StringSelectMenuBuilder()
    .setCustomId('pc_game_select')
    .setPlaceholder('🎮 Select a PC game')
    .addOptions(select_options);

  const select_row = new ActionRowBuilder()
    .addComponents(game_select);

  // Build container
  const container = new ContainerBuilder()
    .addTextDisplayComponents(header_text)
    .addSeparatorComponents(separator1)
    .addTextDisplayComponents(games_text)
    .addSeparatorComponents(separator2)
    .addActionRowComponents(select_row);

  return container;
}

/**
 * Create cheat list embed for a specific game
 * @param {string} game_id
 * @return {ContainerBuilder} Container with cheat list
 */
function create_cheat_list_embed(game_id) {
  const game  = get_pc_game_by_id(game_id);

  if (!game || !game.cheats || game.cheats.length === 0) {
    const error_text = new TextDisplayBuilder()
      .setContent('❌ **Error:** Game or cheats not found.');

    return new ContainerBuilder().addTextDisplayComponents(error_text);
  }

  // Header
  const header_text = new TextDisplayBuilder()
    .setContent(`${game.emoji} **${game.name}**\n\n${game.description}\n\nSelect a cheat to view details:`);

  const separator1 = new SeparatorBuilder();

  // Cheats list
  let cheats_display = '**Available Cheats:**\n\n';
  game.cheats.forEach(cheat => {
    const featureCount = cheat.features ? cheat.features.length : 0;
    cheats_display    += `${cheat.emoji} **${cheat.name}**\n`;
    cheats_display    += `└ ${cheat.description}\n`;
    cheats_display    += `└ ${featureCount} features available\n\n`;
  });

  const cheats_text = new TextDisplayBuilder()
    .setContent(cheats_display);

  const separator2 = new SeparatorBuilder();

  // Back button
  const back_button = new ButtonBuilder()
    .setCustomId('pc_catalog_back')
    .setLabel('🔙 Back to PC Games')
    .setStyle(1); // Primary

  const button_row = new ActionRowBuilder()
    .addComponents(back_button);

  // Cheat select dropdown
  const select_options = game.cheats.map(cheat => {
    // Extract emoji ID from custom emoji format
    const emojiId = cheat.emoji.match(/:(\d{18,19})/)?.[1] || undefined;
    return {
      label     : cheat.name,
      value     : `pccheat-${game_id}-${cheat.id}`,
      emoji     : emojiId,
      description: cheat.description.substring(0, 50) + (cheat.description.length > 50 ? '...' : '')
    };
  });

  const cheat_select = new StringSelectMenuBuilder()
    .setCustomId('pc_cheat_select')
    .setPlaceholder('🛠️ Select a cheat')
    .addOptions(select_options);

  const select_row = new ActionRowBuilder()
    .addComponents(cheat_select);

  // Build container
  const container = new ContainerBuilder()
    .addTextDisplayComponents(header_text)
    .addSeparatorComponents(separator1)
    .addTextDisplayComponents(cheats_text)
    .addSeparatorComponents(separator2)
    .addActionRowComponents(button_row)
    .addActionRowComponents(select_row);

  return container;
}

/**
 * Create cheat detail embed
 * @param {string} game_id
 * @param {string} cheat_id
 * @return {ContainerBuilder} Container with cheat details
 */
function create_cheat_detail_embed(game_id, cheat_id) {
  const game = get_pc_game_by_id(game_id);
  const cheat = get_pc_cheat(game_id, cheat_id);

  if (!game || !cheat) {
    const error_text = new TextDisplayBuilder()
      .setContent('❌ **Error:** Cheat not found.');

    return new ContainerBuilder().addTextDisplayComponents(error_text);
  }

  // Header
  const header_text = new TextDisplayBuilder()
    .setContent(`${cheat.emoji} **${cheat.name}**\n*${cheat.description}*`);

  const separator1 = new SeparatorBuilder();

  // Features
  let features_display = '**Features:**\n\n';
  if (cheat.features && cheat.features.length > 0) {
    features_display += cheat.features.join('\n');
  }

  const features_text = new TextDisplayBuilder()
    .setContent(features_display);

  const separator2 = new SeparatorBuilder();

  // System requirements
  let system_display = '**System Requirements:**\n\n';
  if (cheat.system) {
    system_display += `💻 **Processors:** ${cheat.system.processors}\n`;
    system_display += `🪟 **OS:** ${cheat.system.os}\n`;
    system_display += `🎮 **Graphics:** ${cheat.system.graphics}\n`;
    system_display += `💾 **Disk:** ${cheat.system.disk}\n`;
    system_display += `⚙️ **BIOS:** ${cheat.system.bios}\n`;
    system_display += `🔧 **Type:** ${cheat.system.type}\n`;
  }

  const system_text = new TextDisplayBuilder()
    .setContent(system_display);

  const separator3 = new SeparatorBuilder();

  // Additional info
  let additional_display = '';
  if (cheat.additional && cheat.additional.length > 0) {
    additional_display = '**Additional Information:**\n\n';
    additional_display += cheat.additional.map(info => `✓ ${info}`).join('\n');
  }

  let additional_text = null;
  if (additional_display) {
    additional_text = new TextDisplayBuilder()
      .setContent(additional_display);
  }

  const separator4 = additional_text ? new SeparatorBuilder() : null;

  // Pricing
  let pricing_display = '**Pricing:**\n\n';
  if (cheat.prices && cheat.prices.length > 0) {
    cheat.prices.forEach(price => {
      pricing_display += `**${price.duration}**\n`;
      pricing_display += `└ 💵 ${price.price_idr} / ${price.price_usd}\n\n`;
    });
  }

  const pricing_text = new TextDisplayBuilder()
    .setContent(pricing_display);

  const separator5 = new SeparatorBuilder();

  // Buy Now button
  const buy_button = new ButtonBuilder()
    .setLabel('🛒 Buy Now')
    .setURL('https://discord.com/channels/1338437118296330292/1473664373980528640')
    .setStyle(5); // Link

  // Back button
  const back_button = new ButtonBuilder()
    .setCustomId(`pc_back_cheats-${game_id}`)
    .setLabel('🔙 Back to Cheats')
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

  if (additional_text && separator4) {
    container.addTextDisplayComponents(additional_text);
    container.addSeparatorComponents(separator4);
  }

  container.addTextDisplayComponents(pricing_text);
  container.addSeparatorComponents(separator5);
  container.addActionRowComponents(button_row);

  return container;
}

module.exports = {
  create_main_pc_catalog_embed,
  create_cheat_list_embed,
  create_cheat_detail_embed
};
