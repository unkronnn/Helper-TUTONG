const { MessageFlags, TextDisplayBuilder, ContainerBuilder } = require('discord.js');
const config = require('../config/config.json');
const { handleTicketInteractions } = require('./interactions/tickets');
const { handleSelectMenus } = require('./interactions/selectMenus');
const { handleModals } = require('./interactions/modals');
const SecurityMiddleware = require('../security/middleware');
const InputSanitizer = require('../security/sanitizer');
const auditLogger = require('../security/auditLogger');

// Initialize security
let securityMiddleware;

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
        // Initialize security middleware if not already done
        if (!securityMiddleware) {
            securityMiddleware = new SecurityMiddleware(client);
        }

        // Validate interaction origin
        if (!securityMiddleware.validateInteractionOrigin(interaction)) {
            return;
        }

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

            // Execute command
            try {
                await command.run(client, interaction, interaction.options);
                securityMiddleware.logCommandExecution(
                    interaction.user.id,
                    interaction.commandName,
                    interaction.guildId,
                    true
                );
            } catch (cmdErr) {
                securityMiddleware.logCommandExecution(
                    interaction.user.id,
                    interaction.commandName,
                    interaction.guildId,
                    false,
                    cmdErr.message
                );
                throw cmdErr;
            }
            return;
        }

        // Handle string select menus
        if (interaction.isStringSelectMenu()) {
            const sanitized = interaction.values.map(val => InputSanitizer.sanitizeString(val));
            interaction.values = sanitized;
            await handleSelectMenus(client, interaction);
            return;
        }

        // Handle user select menus
        if (interaction.isUserSelectMenu()) {
            interaction.values.forEach(userId => {
                InputSanitizer.validateInput(userId, 'userId');
            });
            await handleTicketInteractions(client, interaction);
            return;
        }

        // Handle buttons
        if (interaction.isButton()) {
            InputSanitizer.sanitizeString(interaction.customId);

            // Handle catalog buttons
            if (interaction.customId === 'pc_catalog_back' ||
                interaction.customId.startsWith('pc_back_cheats-')) {
                await handleSelectMenus(client, interaction);
                return;
            }

            await handleTicketInteractions(client, interaction);
            return;
        }

        // Handle modals
        if (interaction.isModalSubmit()) {
            const fields = interaction.fields.fields;
            fields.forEach((field, key) => {
                if (typeof field.value === 'string') {
                    field.value = InputSanitizer.sanitizeString(field.value);
                }
            });
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

