const { SlashCommandBuilder, ChannelType, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, ButtonBuilder, ActionRowBuilder, SeparatorBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('@discordjs/builders');
const { MessageFlags } = require('discord.js');
const config = require('../../config/config.json');
const logger = require('../../console/logger');

// Format price to Rupiah
const formatRupiah = (price) => {
    const num = parseInt(price.toString().replace(/\D/g, '')) || 0;
    return `Rp ${num.toLocaleString('id-ID')}`;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joki-testimonial')
        .setDescription('Buat testimonial joki gaming')
        .addStringOption(option =>
            option
                .setName('joki')
                .setDescription('Nama Joki')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('client')
                .setDescription('Nama Client')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('game')
                .setDescription('Nama Game')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('service')
                .setDescription('Jenis Layanan (e.g., Push Rank, Level Up, etc.)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('price')
                .setDescription('Harga')
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option
                .setName('proof')
                .setDescription('Upload foto/bukti hasil joki')
                .setRequired(true)
        ),
    async run(client, interaction, options) {
        try {
            // Check if user is staff
            if (!interaction.member.roles.cache.has(config.staffRoleId) && !interaction.member.permissions.has('Administrator')) {
                const errorBlock = new ContainerBuilder()
                    .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ Hanya staff yang bisa menggunakan command ini!')
                    );
                return await interaction.reply({
                    components: [errorBlock],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }

            // Check if command is used in a ticket thread
            if (!interaction.channel.isThread()) {
                const errorBlock = new ContainerBuilder()
                    .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ Command ini hanya bisa digunakan di dalam ticket!')
                    );
                return await interaction.reply({
                    components: [errorBlock],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }

            // Check if it's a purchase ticket
            if (!interaction.channel.name.includes('purchase')) {
                const errorBlock = new ContainerBuilder()
                    .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ Command ini hanya bisa digunakan di purchase ticket!')
                    );
                return await interaction.reply({
                    components: [errorBlock],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const jokiChannelId = '1455404858520768592';
            const jokiChannel = await client.channels.fetch(jokiChannelId).catch(() => null);

            if (!jokiChannel) {
                const errorBlock = new ContainerBuilder()
                    .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ Joki testimonial channel tidak ditemukan!')
                    );
                return await interaction.editReply({
                    components: [errorBlock],
                    flags: MessageFlags.IsComponentsV2,
                });
            }

            const joki = options.getString('joki');
            const client_name = options.getString('client');
            const game = options.getString('game');
            const service = options.getString('service');
            const price = options.getString('price');
            const proof = options.getAttachment('proof');

            // Get server icon/logo
            const serverIcon = interaction.guild.iconURL({ size: 256, dynamic: true });
            const thumbnail = new ThumbnailBuilder({ media: { url: serverIcon } });

            const header = new TextDisplayBuilder()
                .setContent(`## Voxteria - Testimoni\n\nThank you for using our service.\nWe hope you are satisfied with the results we provided!`);

            const headerSection = new SectionBuilder()
                .addTextDisplayComponents(header)
                .setThumbnailAccessory(thumbnail);

            const jokiInfo = new TextDisplayBuilder()
                .setContent(`• **Buyer:** ${client_name}`);

            const gameInfo = new TextDisplayBuilder()
                .setContent(`• **Game:** ${game}\n• **Service:** ${service}`);

            const priceInfo = new TextDisplayBuilder()
                .setContent(`• **Price:** ${formatRupiah(price)}`);

            const mediaGallery = new MediaGalleryBuilder()
                .addItems(new MediaGalleryItemBuilder().setURL(proof.url));

            const sep = new SeparatorBuilder();

            const testimonialContainer = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addSectionComponents(headerSection)
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(jokiInfo)
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(gameInfo)
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(priceInfo)
                .addSeparatorComponents(sep)
                .addMediaGalleryComponents(mediaGallery);

            // Send testimonial to channel
            await jokiChannel.send({
                components: [testimonialContainer],
                flags: MessageFlags.IsComponentsV2,
            });

            const successBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ✅ Thank you\n\nYour testimonial has been submitted successfully!`)
                );

            await interaction.editReply({
                components: [successBlock],
                flags: MessageFlags.IsComponentsV2,
            });

            logger.info(`[JOKI TESTIMONIAL] Joki testimonial submitted by ${interaction.user.tag} - ${joki} → ${client_name}`);
        } catch (error) {
            console.error('[JOKI TESTIMONIAL ERROR]', error.message);
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`❌ Error: ${error.message}`)
                );
            
            await interaction.editReply({
                components: [errorBlock],
                flags: MessageFlags.IsComponentsV2,
            }).catch(() => {});
        }
    }
};


