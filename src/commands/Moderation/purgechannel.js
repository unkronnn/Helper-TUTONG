const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const config = require('../../config/config.json');
const logger = require('../../console/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge-channel')
        .setDescription('Delete a channel and clone to remove all pings')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to nuke (optional - uses current channel if not specified)')
                .setRequired(false)
        ),

    async run(client, interaction) {
        try {
            // Reply immediately to avoid timeout
            await interaction.reply({
                content: '⏳ Nuking channel...',
                flags: MessageFlags.Ephemeral
            });

            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

            // Permission check
            if (!interaction.member.permissions.has('ManageChannels')) {
                return await interaction.editReply({
                    content: '❌ You need the **Manage Channels** permission to use this command!'
                });
            }

            // Can't nuke system channels
            if (targetChannel.isThread()) {
                return await interaction.editReply({
                    content: '❌ Cannot nuke threads!'
                });
            }

            const channelName = targetChannel.name;
            const channelPosition = targetChannel.position;
            const channelParent = targetChannel.parent;

            // Clone the channel with same settings
            const newChannel = await targetChannel.clone({
                name: channelName,
                position: channelPosition,
                parent: channelParent,
                reason: `Channel purged by ${interaction.user.tag}`
            });

            // Delete the original channel
            await targetChannel.delete(`Channel nuked by ${interaction.user.tag}`);

            // Send purge message to new channel
            const purgeMessage = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`This channel has been purged by <@${interaction.user.id}>.`)
                );

            await newChannel.send({
                components: [purgeMessage],
                flags: MessageFlags.IsComponentsV2,
            });

            // Confirm to user
            await interaction.editReply({
                content: `✅ Channel **${channelName}** has been successfully nuked and recreated!`
            });

            logger.info(`[PURGE-CHANNEL] Channel ${channelName} was nuked by ${interaction.user.tag}`);

        } catch (error) {
            logger.error(`[PURGE-CHANNEL] Error: ${error.message}`);

            try {
                await interaction.editReply({
                    content: `❌ An error occurred while trying to nuke the channel.\n\`\`\`${error.message}\`\`\``
                });
            } catch (editError) {
                // If editReply fails, try followUp instead
                await interaction.followUp({
                    content: `❌ An error occurred while trying to nuke the channel.\n\`\`\`${error.message}\`\`\``,
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};
