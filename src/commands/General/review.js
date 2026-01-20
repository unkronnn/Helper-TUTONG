const { SlashCommandBuilder, ChannelType, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, ButtonBuilder, ActionRowBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('review')
        .setDescription('Submit a review'),
    async run(client, interaction, options) {
        try {
            // Show review form modal
            const reviewModal = new ModalBuilder()
                .setCustomId('review_form_modal')
                .setTitle('Submit Your Review');

            const reviewInput = new TextInputBuilder()
                .setCustomId('review_text')
                .setLabel('Your Review')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const ratingInput = new TextInputBuilder()
                .setCustomId('review_rating')
                .setLabel('Rating (1-5)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('5')
                .setRequired(true);

            const row1 = new ActionRowBuilder().addComponents(reviewInput);
            const row2 = new ActionRowBuilder().addComponents(ratingInput);

            reviewModal.addComponents(row1, row2);
            return await interaction.showModal(reviewModal);
        } catch (error) {
            console.error('[REVIEW ERROR]', error.message);
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
                );
            
            await interaction.reply({
                components: [errorBlock],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            }).catch(() => {});
        }
    }
};
