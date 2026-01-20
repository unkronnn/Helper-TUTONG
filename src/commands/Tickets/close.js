const { SlashCommandBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const config = require('../../config/config.json');
const logger = require('../../console/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Closes the current ticket')
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for closing the ticket (optional)')
                .setRequired(false)
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

            // Check if user has permission to close (staff or ticket owner)
            const isStaff = interaction.member.permissions.has('ManageMessages') || interaction.member.roles.cache.has(config.roles.staff);
            const isTicketOwner = channel.ownerId === interaction.user.id;

            if (!isStaff && !isTicketOwner) {
                const errorBlock = new ContainerBuilder()
                    .setAccentColor(0xFF0000)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ Only staff or ticket owner can close this ticket!')
                    );
                return await interaction.reply({
                    components: [errorBlock],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }

            // Get reason from option or show modal
            let reason = interaction.options.getString('reason');

            if (!reason) {
                // Show modal for reason if not provided
                const reasonModal = new ModalBuilder()
                    .setCustomId('close_ticket_modal')
                    .setTitle('Close Ticket');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('close_reason')
                    .setLabel('Reason for closing')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Why are you closing this ticket?')
                    .setRequired(false);

                const row = new ActionRowBuilder().addComponents(reasonInput);
                reasonModal.addComponents(row);

                return await interaction.showModal(reasonModal);
            }

            // Close the ticket
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Lock and archive thread
            await channel.setLocked(true);
            await channel.setArchived(true);

            const closedBlock = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`✅ **Ticket Closed**\n\n**Closed by:** ${interaction.user.tag}\n**Reason:** ${reason || 'No reason provided'}\n**Closed at:** <t:${Math.floor(Date.now() / 1000)}:f>`)
                );

            await interaction.editReply({
                components: [closedBlock],
                flags: MessageFlags.IsComponentsV2,
            });

            logger.info(`[TICKET] Ticket ${channel.name} closed by ${interaction.user.tag} - Reason: ${reason || 'No reason'}`);
        } catch (error) {
            console.error('[CLOSE TICKET ERROR]', error.message);
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
