const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages from a channel')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Jumlah pesan yang akan dihapus (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Hapus pesan dari user tertentu (optional)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');
    const channel = interaction.channel;
    const guild = interaction.guild;

    try {
      // Check if user has permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Kamu tidak memiliki permission untuk purge messages');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Check if bot can manage messages
      if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Bot tidak memiliki permission untuk purge messages');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Defer reply since purging can take some time
      await interaction.deferReply();

      // Fetch messages
      const messages = await channel.messages.fetch({ limit: amount });

      // Filter messages if user is specified
      let toDelete = targetUser 
        ? messages.filter(msg => msg.author.id === targetUser.id)
        : messages;

      // Delete messages
      let deletedCount = 0;
      for (const message of toDelete.values()) {
        try {
          await message.delete();
          deletedCount++;
        } catch (error) {
          console.error(`Could not delete message: ${error}`);
        }
      }

      const successText = new TextDisplayBuilder()
        .setContent(
          `✅ **Messages Purged**\n\n` +
          `Channel: ${channel.toString()}\n` +
          `Messages Deleted: ${deletedCount}\n` +
          `${targetUser ? `Target User: ${targetUser.username}\n` : ''}` +
          `Moderator: ${interaction.user.username}`
        );

      const successContainer = new ContainerBuilder()
        .setAccentColor(parseInt(config.color, 16))
        .addTextDisplayComponents(successText);

      try {
        const reply = await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [successContainer],
        });
        // Jangan auto-delete - message tetap di channel
      } catch (editError) {
        // If editReply fails, use followUp instead
        await interaction.followUp({
          flags: MessageFlags.IsComponentsV2,
          components: [successContainer],
        });
      }
    } catch (error) {
      console.error(error);
      const errorText = new TextDisplayBuilder()
        .setContent('❌ Terjadi kesalahan saat mem-purge messages');

      const errorContainer = new ContainerBuilder()
        .setAccentColor(0xFF0000)
        .addTextDisplayComponents(errorText);

      try {
        return interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      } catch (editError) {
        return interaction.followUp({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }
    }
  }
};
