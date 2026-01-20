const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const config = require('../../config/config.json');
const logger = require('../../console/logger');

// Store AFK data in memory (bisa di-upgrade ke database)
const afkUsers = new Map();

// Export for event handlers
const getAfkUsers = () => afkUsers;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set AFK status')
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('AFK reason')
                .setRequired(true)
        ),
    
    getAfkUsers,
    
    async run(client, interaction, options) {
        try {
            const reason = options.getString('reason');
            const member = interaction.member;
            const accentColor = parseInt(config.primaryColor.replace('#', ''), 16);

            // Check if already AFK
            if (afkUsers.has(interaction.user.id)) {
                const block = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`❌ Kamu sudah AFK! Gunakan pesan untuk auto-remove AFK.`)
                    );

                return await interaction.reply({
                    components: [block],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }

            // Set nickname with [AFK] prefix
            const originalNick = member.nickname || interaction.user.username;
            const newNick = `[AFK] ${originalNick}`;

            try {
                if (newNick.length <= 32) {
                    await member.setNickname(newNick);
                }
            } catch (err) {
                logger.warn(`[AFK] Failed to set nickname: ${err.message}`);
            }

            // Store AFK data
            afkUsers.set(interaction.user.id, {
                reason: reason,
                timestamp: Date.now(),
                tag: interaction.user.tag,
                originalNick: originalNick
            });

            const block = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${interaction.user} I set your AFK: ${reason}`)
                );

            await interaction.reply({
                components: [block],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            });

            logger.info(`[AFK] ${interaction.user.tag} set AFK - Reason: ${reason}`);
        } catch (error) {
            console.error('[AFK ERROR]', error.message);
            const accentColor = parseInt(config.primaryColor.replace('#', ''), 16);
            const block = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
                );

            await interaction.reply({
                components: [block],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            }).catch(() => {});
        }
    }
};
