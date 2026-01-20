// src/slashCommands/Info/help.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

// Command categories
const commandCategories = {
  info: {
    label: 'ℹ️ Info',
    description: 'Information and utility commands',
    commands: ['afk', 'help', 'membercount', 'ping', 'serverinfo', 'stats', 'whois']
  },
  moderation: {
    label: '🛡️ Moderation',
    description: 'Moderation and management commands',
    commands: ['ban', 'clearwarns', 'deafen', 'delwarn', 'kick', 'lock', 'mute', 'nick', 'purge', 'role', 'softban', 'unban', 'undeafen', 'unlock', 'unmute', 'warn', 'warnlogs']
  },
  payment: {
    label: '💳 Payment',
    description: 'Payment and testimonial commands',
    commands: ['payments', 'status', 'testimonial']
  },
  tickets: {
    label: '🎫 Tickets',
    description: 'Ticket management commands',
    commands: ['add', 'blacklist', 'close']
  },
  general: {
    label: '⭐ General',
    description: 'General purpose commands',
    commands: ['review']
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display available command list'),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const accentColor = parseInt(config.primaryColor.replace('#', ''), 16);

    // Create select menu options
    const selectOptions = Object.entries(commandCategories).map(([key, category]) => 
      new StringSelectMenuOptionBuilder()
        .setLabel(category.label)
        .setValue(key)
        .setDescription(category.description)
    );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_category_select')
      .setPlaceholder('Select a category')
      .addOptions(selectOptions);

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    // Create initial message with all categories
    const headerText = new TextDisplayBuilder()
      .setContent(`# 📚 VoxHelper Commands\n\nSelect a category from the menu below to view commands!`);

    const categoriesText = new TextDisplayBuilder()
      .setContent(
        Object.values(commandCategories)
          .map(cat => `**${cat.label}** - ${cat.description}\n${cat.commands.map(cmd => `  • /${cmd}`).join('\n')}`)
          .join('\n\n')
      );

    const sep = new SeparatorBuilder();
    const container = new ContainerBuilder()
      .setAccentColor(accentColor)
      .addTextDisplayComponents(headerText)
      .addSeparatorComponents(sep)
      .addTextDisplayComponents(categoriesText);

    return interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container, selectRow],
    });
  },
};
