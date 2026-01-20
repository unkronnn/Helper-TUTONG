const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');
const logger = require('../../console/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages from a channel')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Remove only messages from the user')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('bots')
        .setDescription('Allow removing messages from bots')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('humans')
        .setDescription('Allow removing messages from humans')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('embeds')
        .setDescription('Allow removing messages with embeds')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('attachments')
        .setDescription('Allow removing messages with attachments')
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
    const includeBotsOption = interaction.options.getBoolean('bots');
    const includeHumansOption = interaction.options.getBoolean('humans');
    const includeEmbedsOption = interaction.options.getBoolean('embeds');
    const includeAttachmentsOption = interaction.options.getBoolean('attachments');
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
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
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
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          components: [errorContainer],
        });
      }

      // Defer reply since purging can take some time
      await interaction.deferReply();

      // Fetch messages
      const messages = await channel.messages.fetch({ limit: amount });
      let toDelete = messages;

      // Filter by user if specified
      if (targetUser) {
        toDelete = toDelete.filter(msg => msg.author.id === targetUser.id);
      }

      // Filter by bot/human status
      if (includeBotsOption !== null && includeHumansOption !== null) {
        if (includeBotsOption && !includeHumansOption) {
          toDelete = toDelete.filter(msg => msg.author.bot);
        } else if (includeHumansOption && !includeBotsOption) {
          toDelete = toDelete.filter(msg => !msg.author.bot);
        }
        // If both are true or both are false, don't filter
      } else if (includeBotsOption === false) {
        toDelete = toDelete.filter(msg => !msg.author.bot);
      } else if (includeHumansOption === false) {
        toDelete = toDelete.filter(msg => msg.author.bot);
      }

      // Filter by embeds
      if (includeEmbedsOption === false) {
        toDelete = toDelete.filter(msg => msg.embeds.length === 0);
      } else if (includeEmbedsOption === true) {
        toDelete = toDelete.filter(msg => msg.embeds.length > 0);
      }

      // Filter by attachments
      if (includeAttachmentsOption === false) {
        toDelete = toDelete.filter(msg => msg.attachments.size === 0);
      } else if (includeAttachmentsOption === true) {
        toDelete = toDelete.filter(msg => msg.attachments.size > 0);
      }

      // Delete messages
      let deletedCount = 0;
      const failedCount = 0;
      for (const message of toDelete.values()) {
        try {
          await message.delete();
          deletedCount++;
        } catch (error) {
          console.error(`Could not delete message: ${error}`);
        }
      }

      let filterSummary = '';
      if (targetUser) filterSummary += `\n• Target User: ${targetUser.username}`;
      if (includeBotsOption !== null) filterSummary += `\n• Bots: ${includeBotsOption ? 'Included' : 'Excluded'}`;
      if (includeHumansOption !== null) filterSummary += `\n• Humans: ${includeHumansOption ? 'Included' : 'Excluded'}`;
      if (includeEmbedsOption !== null) filterSummary += `\n• Embeds: ${includeEmbedsOption ? 'Only with embeds' : 'Without embeds'}`;
      if (includeAttachmentsOption !== null) filterSummary += `\n• Attachments: ${includeAttachmentsOption ? 'Only with attachments' : 'Without attachments'}`;

      const successText = new TextDisplayBuilder()
        .setContent(
          `✅ **Messages Purged**\n\n` +
          `• Channel: ${channel.toString()}\n` +
          `• Messages Deleted: ${deletedCount}\n` +
          `• Moderator: ${interaction.user.username}` +
          filterSummary
        );

      const successContainer = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16))
        .addTextDisplayComponents(successText);

      try {
        const reply = await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [successContainer],
        });
        // Jangan auto-delete - message tetap di channel
        logger.info(`[PURGE] Deleted ${deletedCount} messages in ${channel.name} by ${interaction.user.tag}`);
      } catch (editError) {
        // If editReply fails, use followUp instead
        await interaction.followUp({
          flags: MessageFlags.IsComponentsV2,
          components: [successContainer],
        });
      }
    } catch (error) {
      console.error('[PURGE ERROR]', error.message);
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
