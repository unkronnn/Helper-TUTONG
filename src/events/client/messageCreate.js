const { ChannelType, MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const config = require('../../config/config.json');
const logger = require('../../console/logger');

// Reference to afkUsers map from command
let afkUsers = null;

module.exports = {
    name: 'messageCreate',
    async execute(client, message) {
        // Initialize afkUsers if not done yet
        if (!afkUsers) {
            const afkCommand = client.slash.get('afk');
            if (afkCommand && afkCommand.getAfkUsers) {
                afkUsers = afkCommand.getAfkUsers();
            } else {
                return; // AFK command not loaded yet
            }
        }

        // Ignore bot messages
        if (message.author.bot) return;

        // Ignore DM
        if (message.channel.isDMBased()) return;

        const accentColor = parseInt(config.primaryColor, 16);

        // Check if message author is AFK
        if (afkUsers.has(message.author.id)) {
            const afkData = afkUsers.get(message.author.id);
            const member = message.member;

            // Remove AFK status
            afkUsers.delete(message.author.id);

            // Reset nickname
            try {
                await member.setNickname(afkData.originalNick);
            } catch (err) {
                logger.warn(`[AFK] Failed to reset nickname: ${err.message}`);
            }

            const totalSeconds = Math.floor((Date.now() - afkData.timestamp) / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const durationStr = `${hours} hours ${minutes} minutes ${seconds} seconds`;

            const messageContent = `Welcome back, ${message.author} I removed your AFK. You were AFK for ${durationStr}.`;

            try {
                const block = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(messageContent)
                    );

                const replyMessage = await message.reply({
                    components: [block],
                    flags: MessageFlags.IsComponentsV2,
                });

                // Delete message after 7 seconds
                setTimeout(() => {
                    replyMessage.delete().catch(() => {});
                }, 7000);
            } catch (err) {
                console.error(`[AFK] Failed to send welcome back message: ${err.message}`);
                logger.error(`[AFK] Failed to send welcome back message: ${err.message}`);
            }

            logger.info(`[AFK] ${message.author.tag} returned from AFK after ${durationStr}`);
            return;
        }

        // Check if message mentions or replies to someone AFK
        const mentionedUsers = message.mentions.users;
        const repliedUser = message.reference 
            ? await message.channel.messages.fetch(message.reference.messageId).then(msg => msg.author).catch(() => null)
            : null;

        let afkUserFound = null;

        // Check mentions
        for (const user of mentionedUsers.values()) {
            if (afkUsers.has(user.id)) {
                afkUserFound = user;
                break;
            }
        }

        // Check replied user
        if (!afkUserFound && repliedUser && afkUsers.has(repliedUser.id)) {
            afkUserFound = repliedUser;
        }

        // Send notification if AFK user was mentioned/replied
        if (afkUserFound) {
            const afkData = afkUsers.get(afkUserFound.id);
            const totalSeconds = Math.floor((Date.now() - afkData.timestamp) / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const durationStr = `${hours} hours ${minutes} minutes ${seconds} seconds`;

            const messageContent = `${afkUserFound} is AFK for ${durationStr}. Reason: ${afkData.reason}`;

            try {
                const block = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(messageContent)
                    );

                await message.reply({
                    components: [block],
                    flags: MessageFlags.IsComponentsV2,
                });
            } catch (err) {
                console.error(`[AFK] Failed to send AFK notification: ${err.message}`);
                logger.error(`[AFK] Failed to send AFK notification: ${err.message}`);
            }

            logger.info(`[AFK] ${message.author.tag} mentioned AFK user ${afkUserFound.tag}`);
        }
    }
};
