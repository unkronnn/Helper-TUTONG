// src/slashCommands/Info/membercount.js
const { SlashCommandBuilder } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags, ThumbnailBuilder, SectionBuilder } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('membercount')
    .setDescription('Display member statistics for the server'),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({ content: '❌ Command ini hanya bisa digunakan di dalam server', ephemeral: true });
    }

    // Fetch member data
    await guild.members.fetch();
    const members = guild.members.cache;

    // Calculate statistics
    const totalMembers = members.size;
    const botCount = members.filter(m => m.user.bot).size;
    const humanCount = totalMembers - botCount;

    // Member count content
    const memberText = new TextDisplayBuilder()
      .setContent(
        `# **Member Count**\n\n` +
        `**Total Member:**\n` +
        `• Jumlah Total: ${totalMembers}\n` +
        `• User: ${humanCount}\n` +
        `• Bot: ${botCount}\n\n`
      );

    const serverIconURL = guild.iconURL({ extension: 'png', size: 128 });
    const thumbnail = new ThumbnailBuilder({ media: { url: serverIconURL } });
    const memberSection = new SectionBuilder()
      .addTextDisplayComponents(memberText)
      .setThumbnailAccessory(thumbnail);

    // Container
    const container = new ContainerBuilder()
      .setAccentColor(parseInt(config.primaryColor, 16))
      .addSectionComponents(memberSection);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  }
};
