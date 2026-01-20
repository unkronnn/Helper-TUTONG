const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const config = require('../../config/config.json');
const logger = require('../../console/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage roles in the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to a role or roles')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to add role to')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to add')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('humans')
                .setDescription('Toggle a role for all humans')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to toggle')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('all')
                .setDescription('Add or remove a role to all users in the server')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to add/remove')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('Add or remove the role')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add', value: 'add' },
                            { name: 'Remove', value: 'remove' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from a role or roles')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to remove role from')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to remove')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('removeall')
                .setDescription('Remove all roles from a user')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to remove all roles from')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('bots')
                .setDescription('Toggle a role for all bots')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to toggle')
                        .setRequired(true)
                )
        ),

    async run(client, interaction) {
        const subcommand = interaction.options.getSubcommand();
        const accentColor = parseInt(config.primaryColor, 16);

        try {
            if (subcommand === 'add') {
                const user = interaction.options.getUser('user');
                const role = interaction.options.getRole('role');
                const member = await interaction.guild.members.fetch(user.id);

                if (member.roles.cache.has(role.id)) {
                    const errorBlock = new ContainerBuilder()
                        .setAccentColor(accentColor)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`❌ User already has this role!`)
                        );
                    return await interaction.reply({
                        components: [errorBlock],
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                    });
                }

                await member.roles.add(role);

                const successBlock = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`✅ Added ${role.toString()} to ${user.toString()}`)
                    );

                await interaction.reply({
                    components: [successBlock],
                    flags: MessageFlags.IsComponentsV2,
                });

                logger.info(`[ROLE] Added ${role.name} to ${user.tag}`);

            } else if (subcommand === 'humans') {
                const role = interaction.options.getRole('role');
                const members = await interaction.guild.members.fetch();
                const humans = members.filter(m => !m.user.bot);

                let added = 0;
                let removed = 0;

                for (const member of humans.values()) {
                    if (member.roles.cache.has(role.id)) {
                        await member.roles.remove(role);
                        removed++;
                    } else {
                        await member.roles.add(role);
                        added++;
                    }
                }

                const successBlock = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`✅ Role toggled!\n\n• Added: ${added}\n• Removed: ${removed}`)
                    );

                await interaction.reply({
                    components: [successBlock],
                    flags: MessageFlags.IsComponentsV2,
                });

                logger.info(`[ROLE] Toggled ${role.name} for humans - Added: ${added}, Removed: ${removed}`);

            } else if (subcommand === 'remove') {
                const user = interaction.options.getUser('user');
                const role = interaction.options.getRole('role');
                const member = await interaction.guild.members.fetch(user.id);

                if (!member.roles.cache.has(role.id)) {
                    const errorBlock = new ContainerBuilder()
                        .setAccentColor(accentColor)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`❌ User doesn't have this role!`)
                        );
                    return await interaction.reply({
                        components: [errorBlock],
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                    });
                }

                await member.roles.remove(role);

                const successBlock = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`✅ Removed ${role.toString()} from ${user.toString()}`)
                    );

                await interaction.reply({
                    components: [successBlock],
                    flags: MessageFlags.IsComponentsV2,
                });

                logger.info(`[ROLE] Removed ${role.name} from ${user.tag}`);

            } else if (subcommand === 'removeall') {
                const user = interaction.options.getUser('user');
                const member = await interaction.guild.members.fetch(user.id);
                const rolesCount = member.roles.cache.size - 1; // Exclude @everyone

                if (rolesCount === 0) {
                    const errorBlock = new ContainerBuilder()
                        .setAccentColor(accentColor)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`❌ User has no roles to remove!`)
                        );
                    return await interaction.reply({
                        components: [errorBlock],
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                    });
                }

                await member.roles.removeAll();

                const successBlock = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`✅ Removed all roles from ${user.toString()}\n\n• Removed: ${rolesCount}`)
                    );

                await interaction.reply({
                    components: [successBlock],
                    flags: MessageFlags.IsComponentsV2,
                });

                logger.info(`[ROLE] Removed all roles from ${user.tag} - Count: ${rolesCount}`);

            } else if (subcommand === 'all') {
                const role = interaction.options.getRole('role');
                const action = interaction.options.getString('action');
                const members = await interaction.guild.members.fetch();

                let count = 0;

                for (const member of members.values()) {
                    if (action === 'add') {
                        if (!member.roles.cache.has(role.id)) {
                            await member.roles.add(role);
                            count++;
                        }
                    } else if (action === 'remove') {
                        if (member.roles.cache.has(role.id)) {
                            await member.roles.remove(role);
                            count++;
                        }
                    }
                }

                const successBlock = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`✅ ${action.charAt(0).toUpperCase() + action.slice(1)} complete!\n\n• Affected members: ${count}`)
                    );

                await interaction.reply({
                    components: [successBlock],
                    flags: MessageFlags.IsComponentsV2,
                });

                logger.info(`[ROLE] ${action === 'add' ? 'Added' : 'Removed'} ${role.name} for all members - Count: ${count}`);

            } else if (subcommand === 'bots') {
                const role = interaction.options.getRole('role');
                const members = await interaction.guild.members.fetch();
                const bots = members.filter(m => m.user.bot);

                let added = 0;
                let removed = 0;

                for (const member of bots.values()) {
                    if (member.roles.cache.has(role.id)) {
                        await member.roles.remove(role);
                        removed++;
                    } else {
                        await member.roles.add(role);
                        added++;
                    }
                }

                const successBlock = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`✅ Role toggled!\n\n• Added: ${added}\n• Removed: ${removed}`)
                    );

                await interaction.reply({
                    components: [successBlock],
                    flags: MessageFlags.IsComponentsV2,
                });

                logger.info(`[ROLE] Toggled ${role.name} for bots - Added: ${added}, Removed: ${removed}`);
            }
        } catch (error) {
            console.error('[ROLE ERROR]', error.message);
            const errorBlock = new ContainerBuilder()
                .setAccentColor(0xFF0000)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
                );

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    components: [errorBlock],
                    flags: MessageFlags.IsComponentsV2,
                });
            } else {
                await interaction.reply({
                    components: [errorBlock],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }
        }
    }
};
