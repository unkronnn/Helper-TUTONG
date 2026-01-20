const { MessageFlags, TextDisplayBuilder, ContainerBuilder } = require('discord.js');
const config = require('../config/config.json');
const { handleTicketInteractions } = require('./interactions/tickets');
const { handleSelectMenus } = require('./interactions/selectMenus');
const { handleModals } = require('./interactions/modals');

// Helper function
function buildErrorBlock(message) {
    const accentColor = parseInt(config.primaryColor, 16);
    
    return new ContainerBuilder()
        .setAccentColor(accentColor)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`❌ ${message}`)
        );
}

async function handleInteraction(client, interaction) {
    try {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.slash.get(interaction.commandName);
            if (!command) return;

            // Block DM (server-only commands)
            if (!interaction.guild) {
                return interaction.reply({
                    components: [buildErrorBlock('This command can only be used in a server.')],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }

            await command.run(client, interaction, interaction.options);
            return;
        }

        // Handle string select menus (payment select, range select)
        if (interaction.isStringSelectMenu()) {
            await handleSelectMenus(client, interaction);
            return;
        }

        // Handle user select menus (ticket add member, middleman add member)
        if (interaction.isUserSelectMenu()) {
            await handleTicketInteractions(client, interaction);
            return;
        }

        // Handle buttons (ticket, middleman, status, review)
        if (interaction.isButton()) {
            await handleTicketInteractions(client, interaction);
            return;
        }

        // Handle modals (review, purchase form, close ticket)
        if (interaction.isModalSubmit()) {
            await handleModals(client, interaction);
            return;
        }

    } catch (err) {
        console.error('[INTERACTION ERROR]', err);

        if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
            const errorBlock = buildErrorBlock('An unexpected error occurred.');
            interaction.reply({
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: [errorBlock],
            }).catch(console.error);
        }
    }
}

module.exports = { handleInteraction };
