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
        .setName('testimonial')
        .setDescription('Buat testimonial transaksi')
        .addStringOption(option =>
            option
                .setName('seller')
                .setDescription('Nama Seller')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('buyer')
                .setDescription('Nama Buyer')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('product')
                .setDescription('Nama Produk')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('price')
                .setDescription('Harga')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('payment_method')
                .setDescription('Metode Pembayaran')
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option
                .setName('proof')
                .setDescription('Upload foto/bukti transaksi')
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

            const testimonialChannelId = config.testimonialChannelId || '1409205898634723409';
            const testimonialChannel = await client.channels.fetch(testimonialChannelId).catch(() => null);

            if (!testimonialChannel) {
                const errorBlock = new ContainerBuilder()
                    .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ Testimonial channel tidak ditemukan!')
                    );
                return await interaction.editReply({
                    components: [errorBlock],
                    flags: MessageFlags.IsComponentsV2,
                });
            }

            const seller = options.getString('seller');
            const buyer = options.getString('buyer');
            const product = options.getString('product');
            const price = options.getString('price');
            const paymentMethod = options.getString('payment_method');
            const proof = options.getAttachment('proof');

            // Get server icon/logo
            const serverIcon = interaction.guild.iconURL({ size: 256, dynamic: true });
            const thumbnail = new ThumbnailBuilder({ media: { url: serverIcon } });

            const header = new TextDisplayBuilder()
                .setContent(`## Voxteria - Testimoni\n\nThank you for shopping with us.\nWe hope you are satisfied with our service.`);

            const headerSection = new SectionBuilder()
                .addTextDisplayComponents(header)
                .setThumbnailAccessory(thumbnail);

            const transactionInfo = new TextDisplayBuilder()
                .setContent(`• **Seller:** ${seller}\n• **Buyer:** ${buyer}`);

            const productInfo = new TextDisplayBuilder()
                .setContent(`• **Product:** ${product}\n• **Price:** ${formatRupiah(price)}`);

            const mediaGallery = new MediaGalleryBuilder()
                .addItems(new MediaGalleryItemBuilder().setURL(proof.url));

            const sep = new SeparatorBuilder();

            const testimonialContainer = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addSectionComponents(headerSection)
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(transactionInfo)
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(productInfo)
                .addSeparatorComponents(sep)
                .addMediaGalleryComponents(mediaGallery);

            // Send testimonial to channel
            await testimonialChannel.send({
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

            logger.info(`[TESTIMONIAL] Testimonial submitted by ${interaction.user.tag} - ${seller} → ${buyer}`);
        } catch (error) {
            console.error('[TESTIMONIAL ERROR]', error.message);
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


