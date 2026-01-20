const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, UserSelectMenuBuilder, ActionRowBuilder } = require('@discordjs/builders');
const config = require('../../config/config.json');
const logger = require('../../console/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Adds a user or role to a ticket')
        .addUserOption(option =>
            option
                .setName('user_or_role')
                .setDescription('The user or role to add to the ticket')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Type of entity to add')
                .setRequired(false)
                .addChoices(
                    { name: 'User', value: 'user' },
                    { name: 'Role', value: 'role' }
                )
        ),

    async run(client, interaction) {
        const accentColor = parseInt(config.primaryColor, 16);
        const channel = interaction.channel;

        try {
            // Check if command is used in a ticket
            if (!channel.isThread()) {
                const errorBlock = new ContainerBuilder()
                    .setAccentColor(0xFF0000)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ This command can only be used in a ticket!')
                    );
                return await interaction.reply({
                    components: [errorBlock],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }

            // Check if it's a ticket (help or purchase)
            if (!channel.name.startsWith('help-') && !channel.name.startsWith('purchase-') && !channel.name.startsWith('midman-')) {
                const errorBlock = new ContainerBuilder()
                    .setAccentColor(0xFF0000)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ This command can only be used in a ticket!')
                    );
                return await interaction.reply({
                    components: [errorBlock],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }

            const user = interaction.options.getUser('user_or_role');
            const guild = interaction.guild;

            // Get the member from guild
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

            // Add member to thread
            await channel.members.add(member);

            const successBlock = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`✅ Added ${member.user.toString()} to the ticket`)
                );

            await interaction.reply({
                components: [successBlock],
                flags: MessageFlags.IsComponentsV2,
            });

            logger.info(`[TICKET] Added ${member.user.tag} to ticket ${channel.name}`);
        } catch (error) {
            console.error('[ADD TICKET ERROR]', error.message);
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
