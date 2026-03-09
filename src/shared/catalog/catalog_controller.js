const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  SectionBuilder
} = require('discord.js');
const config = require('../../config/config.json');
const { get_all_games, get_game_by_id, get_platform, get_cheat } = require('./catalog_data');

/**
 * Create main catalog embed with game selection
 * @return {Object} Container and select menu components
 */
function create_main_catalog_embed() {
  const __accent_color = parseInt(config.primaryColor, 16);

  // - BUILD HEADER WITH SECTION - \\
  const title_section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Mobile Area'),
      new TextDisplayBuilder().setContent('Select a game to view available cheats')
    );

  const separator1 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);

  // - BUILD GAMES LIST - \\
  const games       = get_all_games();
  const games_text  = games
    .map(game => `${game.emoji} **${game.name}**${game.status === 'coming_soon' ? ' *(Coming Soon)*' : ''}`)
    .join('\n');

  const games_display = new TextDisplayBuilder()
    .setContent(games_text);

  const separator2 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);

  // - BUILD SELECT MENU - \\
  const select_options = games
    .filter(game => game.status !== 'coming_soon')
    .map(game =>
      new StringSelectMenuOptionBuilder()
        .setLabel(game.name)
        .setValue(game.id)
        .setDescription(`View ${game.name} cheats`)
    );

  const select_menu = new StringSelectMenuBuilder()
    .setCustomId('catalog_game_select')
    .setPlaceholder('Select a game')
    .addOptions(select_options);

  const select_row = new ActionRowBuilder().addComponents(select_menu);

  // - BUILD CONTAINER - \\
  const container = new ContainerBuilder()
    .setAccentColor(__accent_color)
    .addSectionComponents(title_section)
    .addSeparatorComponents(separator1)
    .addTextDisplayComponents(games_display)
    .addSeparatorComponents(separator2);

  return { container, select_row };
}

/**
 * Create platform selection embed for a game
 * @param {string} game_id
 * @return {Object} Container and select menu components
 */
function create_platform_select_embed(game_id) {
  const __accent_color = parseInt(config.primaryColor, 16);
  const game           = get_game_by_id(game_id);

  if (!game || !game.platforms) {
    return null;
  }

  // - BUILD HEADER WITH SECTION - \\
  const title_section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${game.emoji} ${game.name}`),
      new TextDisplayBuilder().setContent('Select platform to view available cheats')
    );

  const separator1 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);

  // - BUILD PLATFORMS LIST - \\
  const platforms       = Object.values(game.platforms);
  const platforms_text  = platforms
    .map(platform => `${platform.emoji} **${platform.name}**`)
    .join('\n');

  const platforms_display = new TextDisplayBuilder()
    .setContent(platforms_text);

  const separator2 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);

  // - BUILD SELECT MENU - \\
  const select_options = platforms.map(platform =>
    new StringSelectMenuOptionBuilder()
      .setLabel(platform.name)
      .setValue(`${game_id}-${platform.id}`)
      .setDescription(`View ${platform.name} cheats for ${game.name}`)
  );

  const select_menu = new StringSelectMenuBuilder()
    .setCustomId('catalog_platform_select')
    .setPlaceholder('Select platform')
    .addOptions(select_options);

  const select_row = new ActionRowBuilder().addComponents(select_menu);

  // - BUILD CONTAINER - \\
  const container = new ContainerBuilder()
    .setAccentColor(__accent_color)
    .addSectionComponents(title_section)
    .addSeparatorComponents(separator1)
    .addTextDisplayComponents(platforms_display)
    .addSeparatorComponents(separator2);

  return { container, select_row };
}

/**
 * Create cheat selection embed for a platform
 * @param {string} game_id
 * @param {string} platform_id
 * @return {Object} Container and select menu components
 */
function create_cheat_select_embed(game_id, platform_id) {
  const __accent_color = parseInt(config.primaryColor, 16);
  const game           = get_game_by_id(game_id);
  const platform       = get_platform(game_id, platform_id);

  if (!game || !platform || !platform.cheats) {
    return null;
  }

  // - BUILD HEADER WITH SECTION - \\
  const title_section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${platform.emoji} ${platform.name} - ${game.name}`),
      new TextDisplayBuilder().setContent('Select a cheat to view details')
    );

  const separator1 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);

  // - BUILD CHEATS LIST - \\
  const cheats_text = platform.cheats
    .map(cheat => `${cheat.emoji} **${cheat.name}**`)
    .join('\n');

  const cheats_display = new TextDisplayBuilder()
    .setContent(cheats_text);

  const separator2 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);

  // - BUILD SELECT MENU - \\
  const select_options = platform.cheats.map(cheat =>
    new StringSelectMenuOptionBuilder()
      .setLabel(cheat.name)
      .setValue(`${game_id}-${platform_id}-${cheat.id}`)
      .setDescription(`View ${cheat.name} details`)
  );

  const select_menu = new StringSelectMenuBuilder()
    .setCustomId('catalog_cheat_select')
    .setPlaceholder('Select cheat')
    .addOptions(select_options);

  const select_row = new ActionRowBuilder().addComponents(select_menu);

  // - BUILD CONTAINER - \\
  const container = new ContainerBuilder()
    .setAccentColor(__accent_color)
    .addSectionComponents(title_section)
    .addSeparatorComponents(separator1)
    .addTextDisplayComponents(cheats_display)
    .addSeparatorComponents(separator2);

  return { container, select_row };
}

/**
 * Create cheat detail embed
 * @param {string} game_id
 * @param {string} platform_id
 * @param {string} cheat_id
 * @return {Object} Container with cheat details
 */
function create_cheat_detail_embed(game_id, platform_id, cheat_id) {
  const __accent_color = parseInt(config.primaryColor, 16);
  const game           = get_game_by_id(game_id);
  const platform       = get_platform(game_id, platform_id);
  const cheat          = get_cheat(game_id, platform_id, cheat_id);

  if (!game || !platform || !cheat) {
    return null;
  }

  // - BUILD HEADER WITH SECTION - \\
  const title_section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${cheat.emoji} ${cheat.name}`),
      new TextDisplayBuilder().setContent(`${platform.emoji} ${platform.name} - ${game.name}`)
    );

  const separator1 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);

  // - BUILD DESCRIPTION - \\
  const container = new ContainerBuilder()
    .setAccentColor(__accent_color)
    .addSectionComponents(title_section)
    .addSeparatorComponents(separator1);

  if (cheat.description) {
    const description_text = new TextDisplayBuilder()
      .setContent(`**Description:**\n${cheat.description}`);

    container.addTextDisplayComponents(description_text);

    const separator2 = new SeparatorBuilder();
    container.addSeparatorComponents(separator2);
  }

  // - BUILD FEATURES - \\
  if (cheat.features && cheat.features.length > 0) {
    const features_text = new TextDisplayBuilder()
      . setContent(`**Features:**\n${cheat.features.map(f => `• ${f}`).join('\n')}`);

    container.addTextDisplayComponents(features_text);

    const separator3 = new SeparatorBuilder();
    container.addSeparatorComponents(separator3);
  }

  // - BUILD PRICES - \\
  if (cheat.prices && cheat.prices.length > 0) {
    const prices_text = cheat.prices
      .map(p => `**${p.duration}**\n${p.price}`)
      .join('\n\n');

    const pricing_display = new TextDisplayBuilder()
      .setContent(`**Pricing:**\n${prices_text}`);

    container.addTextDisplayComponents(pricing_display);

    const separator4 = new SeparatorBuilder();
    container.addSeparatorComponents(separator4);
  }

  // - ADD BUY NOW BUTTON - \\
  const buy_button = new ButtonBuilder()
    .setLabel('Buy Now')
    .setURL('https://discord.com/channels/1338437118296330292/1473664373980528640')
    .setStyle(ButtonStyle.Link);

  const button_row = new ActionRowBuilder().addComponents(buy_button);

  return { container, button_row };
}

/**
 * Create back to main menu select menu
 * @return {ActionRowBuilder} Action row with back button
 */
function create_back_button() {
  // - BACK TO GAMES - \\
  const back_menu = new StringSelectMenuBuilder()
    .setCustomId('catalog_back_to_main')
    .setPlaceholder('← Back to Games')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Back to Games')
        .setValue('back')
        .setDescription('Return to main game selection')
    );

  return new ActionRowBuilder().addComponents(back_menu);
}

module.exports = {
  create_main_catalog_embed,
  create_platform_select_embed,
  create_cheat_select_embed,
  create_cheat_detail_embed,
  create_back_button
};
