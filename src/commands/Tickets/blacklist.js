const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const config = require('../../config/config.json');
const logger = require('../../console/logger');
const fs = require('fs');
const path = require('path');

const blacklistFile = path.join(__dirname, '../../config/blacklist.json');

const getBlacklist = () => {
    try {
        if (!fs.existsSync(blacklistFile)) {
            fs.writeFileSync(blacklistFile, JSON.stringify({ users: [], roles: [] }, null, 2), 'utf8');
        }
        const data = fs.readFileSync(blacklistFile, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('[BLACKLIST ERROR]', err.message);
        return { users: [], roles: [] };
    }
};

const saveBlacklist = (data) => {
    try {
        fs.writeFileSync(blacklistFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('[BLACKLIST SAVE ERROR]', err.message);
    }
};

const isBlacklisted = (userId, roleId = null) => {
    const blacklist = getBlacklist();
    
    // Check user blacklist
    if (blacklist.users.includes(userId)) {
        return true;
    }
    
    // Check role blacklist
    if (roleId && blacklist.roles.includes(roleId)) {
        return true;
    }
    
    return false;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Toggles whether users are allowed to interact with the bot')
        .addUserOption(option =>
            option
                .setName('user_or_role')
                .setDescription('The user or role to toggle blacklist')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async run(client, interaction) {
        const accentColor = parseInt(config.primaryColor, 16);
        const user = interaction.options.getUser('user_or_role');
        const guild = interaction.guild;

        try {
            // Get blacklist
            const blacklist = getBlacklist();
            
            // Check if user exists in guild
            const member = await guild.members.fetch(user.id).catch(() => null);

            if (!member) {
                const errorBlock = new ContainerBuilder()
                    .setAccentColor(0xFF0000)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ User not found in this server!')
                    );
                return await interaction.reply({
                    components: [errorBlock],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }

            let action = '';
            let isNowBlacklisted = false;

            // Toggle blacklist
            if (blacklist.users.includes(user.id)) {
                // Remove from blacklist
                blacklist.users = blacklist.users.filter(id => id !== user.id);
                action = 'removed from';
                isNowBlacklisted = false;
            } else {
                // Add to blacklist
                blacklist.users.push(user.id);
                action = 'added to';
                isNowBlacklisted = true;
            }

            // Save blacklist
            saveBlacklist(blacklist);

            const successBlock = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`✅ ${user.toString()} has been ${action} blacklist\n\n• Status: ${isNowBlacklisted ? '🚫 Blacklisted' : '✅ Whitelisted'}`)
                );

            await interaction.reply({
                components: [successBlock],
                flags: MessageFlags.IsComponentsV2,
            });

            logger.info(`[BLACKLIST] ${user.tag} ${action === 'added to' ? 'blacklisted' : 'whitelisted'} by ${interaction.user.tag}`);
        } catch (error) {
            console.error('[BLACKLIST COMMAND ERROR]', error.message);
            const errorBlock = new ContainerBuilder()
                .setAccentColor(0xFF0000)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
                );

            await interaction.reply({
                components: [errorBlock],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            });
        }
    }
};

// Export blacklist check function for use in other commands
module.exports.isBlacklisted = isBlacklisted;
