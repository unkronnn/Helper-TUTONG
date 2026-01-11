// src/slashCommands/Info/serverinfo.js
const { SlashCommandBuilder } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags, ThumbnailBuilder, SectionBuilder, SeparatorBuilder } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Tampilkan informasi detail tentang server'),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({ content: '❌ Command ini hanya bisa digunakan di dalam server', ephemeral: true });
    }

    // Fetch data
    await guild.members.fetch();
    const members = guild.members.cache;
    const totalMembers = members.size;
    const botCount = members.filter(m => m.user.bot).size;
    const humanCount = totalMembers - botCount;

    // Server info
    const owner = await guild.fetchOwner();
    const created = new Date(guild.createdTimestamp);
    const createdDate = `${created.getDate()}/${created.getMonth() + 1}/${created.getFullYear()}`;
    
    // Header dengan server name dan icon
    const headerText = new TextDisplayBuilder()
      .setContent(`# **${guild.name}**\n\n**Server Information:**\n• ID: ${guild.id}\n• Owner: ${owner.user.username}`);

    const serverIconURL = guild.iconURL({ extension: 'png', size: 128 });
    const thumbnail = new ThumbnailBuilder({ media: { url: serverIconURL } });
    const headerSection = new SectionBuilder()
      .addTextDisplayComponents(headerText)
      .setThumbnailAccessory(thumbnail);

    // Server details
    const textChannels = guild.channels.cache.filter(ch => ch.isTextBased()).size;
    const voiceChannels = guild.channels.cache.filter(ch => ch.isVoiceBased()).size;
    const categories = guild.channels.cache.filter(ch => ch.type === 4).size;
    const emojiCount = guild.emojis.cache.size;
    const maxEmojis = guild.premiumTier === 0 ? 50 : guild.premiumTier === 1 ? 100 : guild.premiumTier === 2 ? 150 : 250;

    const detailsText = new TextDisplayBuilder()
      .setContent(
        `**📊 Member Statistics:**\n` +
        `• Total Members: ${totalMembers}\n` +
        `• Users: ${humanCount}\n` +
        `• Bots: ${botCount}\n\n` +
        `**🏗️ Server Structure:**\n` +
        `• Roles: ${guild.roles.cache.size}\n` +
        `• Channels: ${guild.channels.cache.size} (Text: ${textChannels}, Voice: ${voiceChannels}, Category: ${categories})\n` +
        `• Emojis: ${emojiCount}/${maxEmojis}\n\n` +
        `**📅 Server Details:**\n` +
        `• Created: ${createdDate}\n` +
        `• Boost Level: Level ${guild.premiumTier}\n` +
        `• Boost Count: ${guild.premiumSubscriptionCount || 0}\n\n` +
        `**⚙️ Server Settings:**\n` +
        `• Verification Level: ${getVerificationLevel(guild.verificationLevel)}\n` +
        `• Content Filter: ${getContentFilter(guild.explicitContentFilter)}\n` +
        `• Default Notifications: ${getDefaultNotifications(guild.defaultMessageNotifications)}`
      );

    const sep = new SeparatorBuilder();
    const container = new ContainerBuilder()
      .setAccentColor(parseInt(config.color, 16))
      .addSeparatorComponents(sep)
      .addSectionComponents(headerSection)
      .addSeparatorComponents(sep)
      .addTextDisplayComponents(detailsText)
      .addSeparatorComponents(sep);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  }
};

function getVerificationLevel(level) {
  const levels = {
    0: 'None',
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Very High'
  };
  return levels[level] || 'Unknown';
}

function getContentFilter(filter) {
  const filters = {
    0: 'Disabled',
    1: 'Members without roles',
    2: 'All members'
  };
  return filters[filter] || 'Unknown';
}

function getDefaultNotifications(notif) {
  const notifs = {
    0: 'All messages',
    1: 'Only mentions'
  };
  return notifs[notif] || 'Unknown';
}
