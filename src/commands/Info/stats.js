// src/slashCommands/Info/info.js
const { SlashCommandBuilder } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Display detailed bot information'),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    // Get current guild member stats
    const guild = interaction.guild;
    const totalMembers = guild.memberCount;
    const realMembers = guild.members.cache.filter(m => !m.user.bot).size;
    const botCount = totalMembers - realMembers;
    const buyerCount = config.roles.buyer 
      ? guild.members.cache.filter(m => m.roles.cache.has(config.roles.buyer)).size 
      : 0;

    // Count command files
    const commandsPath = path.join(__dirname, '../../commands');
    let commandCount = 0;
    if (fs.existsSync(commandsPath)) {
      const dirs = fs.readdirSync(commandsPath);
      dirs.forEach(dir => {
        const dirPath = path.join(commandsPath, dir);
        if (fs.statSync(dirPath).isDirectory()) {
          const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
          commandCount += files.length;
        }
      });
    }

    const uptimeStr = formatUptime(client.uptime);
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const nodeVersion = process.version;
    const botAvatarURL = client.user.displayAvatarURL({ extension: 'png', size: 128 });

    // Header dengan text kiri, gambar kanan
    const headerText = new TextDisplayBuilder()
      .setContent(`# **Bot Statistics**\n\n**Bot Information:**\n• Name: ${client.user.username}\n• ID: ${client.user.id}`);

    const thumbnail = new ThumbnailBuilder({ media: { url: botAvatarURL } });
    const headerSection = new SectionBuilder()
      .addTextDisplayComponents(headerText)
      .setThumbnailAccessory(thumbnail);

    // Teknis dan Statistik - ADVANCED REALTIME
    const memUsagePercent = Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100);
    const statusHealth = client.ws.ping < 100 ? '🟢 Excellent' : client.ws.ping < 200 ? '🟡 Good' : '🔴 Poor';
    const uptime24h = client.uptime > (24 * 60 * 60 * 1000);
    const cacheStats = {
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
      channels: client.channels.cache.size,
      members: client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)
    };

    // Realtime metrics
    const memHeap = process.memoryUsage();
    const memHeapPercent = Math.round((memHeap.heapUsed / memHeap.heapTotal) * 100);
    const rss = (memHeap.rss / 1024 / 1024).toFixed(2);
    const external = (memHeap.external / 1024 / 1024).toFixed(2);

    // Cluster/Shard info
    const totalShards = client.cluster?.info?.TOTAL_SHARDS || client.shard?.count || 1;
    const currentShard = client.cluster?.info?.CLUSTER_ID || client.shard?.ids?.[0] || 0;
    const clusterId = client.cluster?.id || 0;

    const detailsText = new TextDisplayBuilder()
      .setContent(
        `**👥 Server Member Statistics:**\n` +
        `• Total Member: ${totalMembers}\n` +
        `• User: ${realMembers}\n` +
        `• Bot: ${botCount}\n` +
        `**🔧 Technical Stack:**\n` +
        `• Discord.js Version: v14 (Latest)\n` +
        `• Node.js: ${process.version}\n` +
        `• Platform: ${process.platform.toUpperCase()}\n\n` +
        `**⚡ Performance Metrics:**\n` +
        `• Uptime: ${uptimeStr} ${uptime24h ? '✅' : '⏱️'}\n` +
        `• Heap Memory: ${memoryUsage}MB / ${(memHeap.heapTotal / 1024 / 1024).toFixed(2)}MB (${memHeapPercent}%)\n` +
        `• WebSocket Ping: ${client.ws.ping}ms ${statusHealth}\n` +
        `• Response Time: ${client.ws.ping}ms\n\n` +
        `**📊 Global Statistics:**\n` +
        `• Total Guilds: ${cacheStats.guilds}\n` +
        `• Total Users: ${cacheStats.users}\n` +
        `• Total Members: ${cacheStats.members.toLocaleString()}\n` +
        `• Cached Channels: ${cacheStats.channels}\n` +
        `• Commands Available: ${commandCount}\n\n` +
        `**🟢 Bot Status:**\n` +
        `• Uptime: ${uptimeStr}\n` +
        `• Shards: ${totalShards} (Currently on shard ${currentShard})\n` +
        `• Cluster: ${clusterId}\n` +
        `• Health: ${client.ws.ping < 300 ? '✅ Healthy' : '⚠️ Warning'}`
      );

    const sep = new SeparatorBuilder();
    const container = new ContainerBuilder()
      .setAccentColor(parseInt(config.primaryColor.replace('#', ''), 16))
      .addSeparatorComponents(sep)
      .addSectionComponents(headerSection)
      .addSeparatorComponents(sep)
      .addTextDisplayComponents(detailsText)
      .addSeparatorComponents(sep);

    return interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  },
};

function formatUptime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
