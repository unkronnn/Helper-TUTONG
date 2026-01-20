const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel (prevent members from sending messages)')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to lock (optional')
        .setRequired(false)
        .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const guild = interaction.guild;

    try {
      // Check if user has permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Kamu tidak memiliki permission untuk lock channel');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Check if bot can manage channel
      if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Bot tidak memiliki permission untuk lock channel');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Lock the channel by denying SEND_MESSAGES permission to @everyone
      await channel.permissionOverwrites.edit(guild.id, {
        SendMessages: false,
      });

      const successText = new TextDisplayBuilder()
        .setContent(
          `## :white_check_mark: Channel locked.\n\n` +
          `Channel: ${channel.name}\n` +
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
        .setContent('❌ Terjadi kesalahan saat mem-lock channel');

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
