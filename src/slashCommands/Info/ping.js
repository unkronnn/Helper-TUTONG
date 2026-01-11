// src/slashCommands/Utility/ping.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the app latency and status!'),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    // Check app permissions
    const requiredAppPermissions = [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.EmbedLinks,
      PermissionsBitField.Flags.ReadMessageHistory,
    ];

    const appPerms = interaction.channel.permissionsFor(interaction.guild.members.me);
    const missingPerms = requiredAppPermissions.filter((perm) => !appPerms.has(perm));

    if (missingPerms.length > 0) {
      const permNames = missingPerms
        .map((perm) => Object.keys(PermissionsBitField.Flags).find((key) => PermissionsBitField.Flags[key] === perm))
        .join(', ');

      const errorText = new TextDisplayBuilder()
        .setContent(`⚠ **Missing Permissions**\nI need the following permissions to run this command: **${permNames}**`);

      const sep = new SeparatorBuilder();
      const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
        .addSeparatorComponents(sep)
        .addTextDisplayComponents(errorText)
        .addSeparatorComponents(sep);

      return interaction.reply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [container],
      });
    }

    // Measure latency
    const sent = Date.now();
    const apiLatency = Date.now() - sent;
    const wsLatency = client.ws.ping;
    const uptime = client.uptime;

    // Calculate status indicator
    const getStatus = (latency) => {
      if (latency < 100) return '🟢 Excellent';
      if (latency < 200) return '🟡 Good';
      if (latency < 400) return '🟠 Fair';
      return '🔴 Poor';
    };

    const uptimeStr = formatUptime(uptime);

    const pingText = new TextDisplayBuilder()
      .setContent(
        `# 🏓 **Bot Status**\n\n` +
        `**WebSocket Ping:** ${wsLatency}ms (${getStatus(wsLatency)})\n` +
        `**API Response:** ${apiLatency}ms`
      );

    const separator = new SeparatorBuilder();
    const container = new ContainerBuilder()
      .setAccentColor(parseInt(config.color.replace('#', ''), 16))
      .addSeparatorComponents(separator)
      .addTextDisplayComponents(pingText)
      .addSeparatorComponents(separator);

    await interaction.reply({
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
