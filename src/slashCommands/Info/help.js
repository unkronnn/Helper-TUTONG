// src/slashCommands/Info/help.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, ButtonBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Tampilkan daftar command yang tersedia'),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    // Get all commands
    const commandsList = Array.from(client.slash.values())
      .filter(cmd => cmd.data?.name)
      .map(cmd => `**/${cmd.data.name}** - ${cmd.data.description || 'Tidak ada deskripsi'}`)
      .join('\n');

    const helpText = new TextDisplayBuilder()
      .setContent(`# 📚 VoxHelper Commands\n\n${commandsList || 'Tidak ada commands yang tersedia'}`);

    const sep = new SeparatorBuilder();
    const container = new ContainerBuilder()
      .setAccentColor(parseInt(config.color.replace('#', ''), 16))
      .addSeparatorComponents(sep)
      .addTextDisplayComponents(helpText)
      .addSeparatorComponents(sep);

    return interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  },
};
