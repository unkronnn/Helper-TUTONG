const { MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const { handleInteraction } = require('../../handlers/interactionRouter');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(client, interaction) {
        try {
            await handleInteraction(client, interaction);
        } catch (err) {
            console.error('[INTERACTION ERROR]', err);

            if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                const errorBlock = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('An unexpected error occurred while handling this interaction.')
                    );

                interaction.reply({
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                    components: [errorBlock],
                }).catch(console.error);
            }
        }
    }
};
