// src/slashCommands/Moderation/unban.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .addStringOption(option =>
      option
        .setName('user_id')
        .setDescription('User ID to unban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for unban (optional')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guild = interaction.guild;

    try {
      // Check if user has permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Kamu tidak memiliki permission untuk unban member');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Check if bot can ban
      if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Bot tidak memiliki permission untuk unban member');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Check if user is actually banned
      const bans = await guild.bans.fetch();
      const bannedUser = bans.find(ban => ban.user.id === userId);

      if (!bannedUser) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ User ini tidak di-ban di server');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      await guild.bans.remove(userId, reason);

      // Send DM to user
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('Unbanned')
          .setDescription(`Your ban has been lifted on **${guild.name}**. You can now rejoin.`)
          .addFields(
            { name: 'Reason', value: reason || 'No reason provided', inline: false }
          )
          .setFooter({ text: `Moderator: ${interaction.user.username}` })
          .setTimestamp();

        await bannedUser.user.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        logger.info(`Could not DM ${bannedUser.user.username}`);
      }

      const successText = new TextDisplayBuilder()
        .setContent(
          `## :white_check_mark: User unbanned.\n\n` +
          `Target: ${bannedUser.user.username}\n` +
          `User ID: ${bannedUser.user.id}\n` +
          `Reason: ${reason}\n` +
          `Moderator: ${interaction.user.username}`
        );

      const successContainer = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16))
        .addTextDisplayComponents(successText);

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [successContainer],
      });
    } catch (error) {
      console.error(error);
      const errorText = new TextDisplayBuilder()
        .setContent('❌ Terjadi kesalahan saat meng-unban user');

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


