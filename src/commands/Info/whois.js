// src/slashCommands/Info/whois.js
const { SlashCommandBuilder } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags, ThumbnailBuilder, SectionBuilder, SeparatorBuilder } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('Display detailed user information')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to view (default: yourself)')
        .setRequired(false)
    ),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const guild = interaction.guild;

    if (!guild) {
      const errorText = new TextDisplayBuilder()
        .setContent('❌ Command ini hanya bisa digunakan di dalam server');

      const errorContainer = new ContainerBuilder()
        .setAccentColor(0xFF0000)
        .addTextDisplayComponents(errorText);

      return interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer],
      });
    }

    try {
      const guildMember = await guild.members.fetch(targetUser.id).catch(() => null);

      if (!guildMember) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ User tidak ditemukan di server ini');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // User info
      const joinedAt = new Date(guildMember.joinedTimestamp);
      const joinedDate = `${joinedAt.getDate()}/${joinedAt.getMonth() + 1}/${joinedAt.getFullYear()} ${joinedAt.getHours()}:${String(joinedAt.getMinutes()).padStart(2, '0')}`;

      const registeredAt = new Date(targetUser.createdTimestamp);
      const registeredDate = `${registeredAt.getDate()}/${registeredAt.getMonth() + 1}/${registeredAt.getFullYear()} ${registeredAt.getHours()}:${String(registeredAt.getMinutes()).padStart(2, '0')}`;

      // Roles (exclude @everyone)
      const roles = guildMember.roles.cache
        .filter(r => r.id !== guild.id)
        .sort((a, b) => b.position - a.position)
        .map(r => r.toString())
        .join(' ') || 'None';

      // Key permissions
      const keyPermissions = [
        'Administrator',
        'ManageGuild',
        'ManageRoles',
        'ManageChannels',
        'ManageMessages',
        'ManageWebhooks',
        'ManageNicknames',
        'ManageEmojisAndStickers',
        'KickMembers',
        'BanMembers',
        'MentionEveryone',
        'ModerateMembers'
      ];

      const permissions = guildMember.permissions;
      const hasPerms = keyPermissions
        .filter(perm => permissions.has(perm))
        .map(perm => formatPermissionName(perm))
        .join(', ') || 'None';

      // Acknowledgements
      const acknowledgements = [];
      if (guildMember.id === guild.ownerId) {
        acknowledgements.push('Server Owner');
      }
      if (guildMember.user.bot) {
        acknowledgements.push('Bot');
      }
      if (guildMember.user.system) {
        acknowledgements.push('System');
      }
      const acksText = acknowledgements.length > 0 ? acknowledgements.join(', ') : 'None';

      // Header dengan user name dan avatar
      const headerText = new TextDisplayBuilder()
        .setContent(`# **${guildMember.displayName}**\n\n**User Information:**\n• Username: ${targetUser.username}\n• ID: ${targetUser.id}`);

      const userAvatarURL = targetUser.displayAvatarURL({ extension: 'png', size: 128 });
      const thumbnail = new ThumbnailBuilder({ media: { url: userAvatarURL } });
      const headerSection = new SectionBuilder()
        .addTextDisplayComponents(headerText)
        .setThumbnailAccessory(thumbnail);

      // User details
      const detailsText = new TextDisplayBuilder()
        .setContent(
          `**Joined**\n` +
          `${joinedDate}\n\n` +
          `**Registered**\n` +
          `${registeredDate}\n\n` +
          `**Roles [${guildMember.roles.cache.size - 1}]**\n` +
          `${roles}\n\n` +
          `**Key Permissions**\n` +
          `${hasPerms}\n\n` +
          `**Acknowledgements**\n` +
          `${acksText}\n\n`
        );

      const sep = new SeparatorBuilder();
      const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16))
        .addSeparatorComponents(sep)
        .addSectionComponents(headerSection)
        .addSeparatorComponents(sep)
        .addTextDisplayComponents(detailsText)
        .addSeparatorComponents(sep);

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      });
    } catch (error) {
      console.error(error);
      const errorText = new TextDisplayBuilder()
        .setContent('❌ Terjadi kesalahan saat mengambil data user');

      const errorContainer = new ContainerBuilder()
        .setAccentColor(0xFF0000)
        .addTextDisplayComponents(errorText);

      return interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer],
      });
    }
  }
};

function formatPermissionName(perm) {
  const permissionMap = {
    'Administrator': 'Administrator',
    'ManageGuild': 'Manage Server',
    'ManageRoles': 'Manage Roles',
    'ManageChannels': 'Manage Channels',
    'ManageMessages': 'Manage Messages',
    'ManageWebhooks': 'Manage Webhooks',
    'ManageNicknames': 'Manage Nicknames',
    'ManageEmojisAndStickers': 'Manage Emojis and Stickers',
    'KickMembers': 'Kick Members',
    'BanMembers': 'Ban Members',
    'MentionEveryone': 'Mention Everyone',
    'ModerateMembers': 'Timeout Members'
  };
  return permissionMap[perm] || perm;
}
