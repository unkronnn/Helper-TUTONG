const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('@discordjs/builders');
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
        .setDescription('Create testimonial')
        .addSubcommand(subcommand =>
            subcommand
                .setName('rekber')
                .setDescription('Submit middleman/escrow testimonial')
                .addUserOption(option =>
                    option
                        .setName('buyer')
                        .setDescription('Buyer user')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option
                        .setName('seller')
                        .setDescription('Seller user')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('price')
                        .setDescription('Original transaction price (e.g., Rp 50.000)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('price_range')
                        .setDescription('Transaction price range')
                        .setRequired(true)
                        .addChoices(
                            { name: '💰 Rp 10.000 - Rp 50.000 (Biaya: Rp 2.000)', value: 'Rp 10.000 - Rp 50.000' },
                            { name: '💰 Rp 50.001 - Rp 100.000 (Biaya: Rp 5.000)', value: 'Rp 50.001 - Rp 100.000' },
                            { name: '💰 Rp 100.001 - Rp 300.000 (Biaya: Rp 10.000)', value: 'Rp 100.001 - Rp 300.000' },
                            { name: '💰 Rp 300.001 - Rp 500.000 (Biaya: Rp 15.000)', value: 'Rp 300.001 - Rp 500.000' },
                            { name: '💰 Rp 500.001 - Rp 1.000.000 (Biaya: Rp 25.000)', value: 'Rp 500.001 - Rp 1.000.000' },
                            { name: '💰 > Rp 1.000.000 (Biaya: 2% flat)', value: '> Rp 1.000.000' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('joki')
                .setDescription('Create gaming booster testimonial')
                .addStringOption(option =>
                    option
                        .setName('client')
                        .setDescription('Client name')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('game')
                        .setDescription('Game name')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('service')
                        .setDescription('Service type (e.g., Push Rank, Level Up, etc.)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('price')
                        .setDescription('Price')
                        .setRequired(true)
                )
                .addAttachmentOption(option =>
                    option
                        .setName('proof')
                        .setDescription('Upload proof/screenshot of completed service')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('transaksi')
                .setDescription('Create transaction testimonial')
                .addStringOption(option =>
                    option
                        .setName('seller')
                        .setDescription('Seller name')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('buyer')
                        .setDescription('Buyer name')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('product')
                        .setDescription('Product name')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('price')
                        .setDescription('Product name')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('payment_method')
                        .setDescription('Payment method')
                        .setRequired(true)
                )
                .addAttachmentOption(option =>
                    option
                        .setName('proof')
                        .setDescription('Upload transaction proof/screenshot')
                        .setRequired(true)
                )
        ),
    async run(client, interaction, options) {
        try {
            // Defer reply immediately to avoid timeout
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Check if user is staff
            if (!interaction.member.roles.cache.has(config.roles.staff) && !interaction.member.permissions.has('Administrator')) {
                const errorBlock = new ContainerBuilder()
                    .setAccentColor(parseInt(config.primaryColor, 16))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ Only staff can use this command!')
                    );
                return await interaction.editReply({
                    components: [errorBlock],
                    flags: MessageFlags.IsComponentsV2,
                });
            }

            // Check if command is used in a ticket thread
            if (!interaction.channel.isThread()) {
                const errorBlock = new ContainerBuilder()
                    .setAccentColor(parseInt(config.primaryColor, 16))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ Command can only be used inside a ticket!')
                    );
                return await interaction.editReply({
                    components: [errorBlock],
                    flags: MessageFlags.IsComponentsV2,
                });
            }

            const subcommand = interaction.options.getSubcommand();
            const serverIcon = interaction.guild.iconURL({ size: 256, dynamic: true });
            const thumbnail = new ThumbnailBuilder({ media: { url: serverIcon } });
            const sep = new SeparatorBuilder();

            if (subcommand === 'rekber') {
                // Check if it's a middleman ticket
                if (!interaction.channel.name.includes('midman')) {
                    const errorBlock = new ContainerBuilder()
                        .setAccentColor(parseInt(config.primaryColor, 16))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('❌ Command can only be used in a middleman ticket!')
                        );
                    return await interaction.editReply({
                        components: [errorBlock],
                        flags: MessageFlags.IsComponentsV2,
                    });
                }

                const midmanLogsChannel = await client.channels.fetch(config.channels.logsMiddleman).catch(() => null);

                if (!midmanLogsChannel) {
                    const errorBlock = new ContainerBuilder()
                        .setAccentColor(parseInt(config.primaryColor, 16))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('❌ channel not found!')
                        );
                    return await interaction.editReply({
                        components: [errorBlock],
                        flags: MessageFlags.IsComponentsV2,
                    });
                }

                const buyerUser = options.getUser('buyer');
                const sellerUser = options.getUser('seller');
                const price = options.getString('price');
                const priceRange = options.getString('price_range');

                // Determine fee based on price range
                let fee = '';
                if (priceRange === 'Rp 10.000 - Rp 50.000') fee = 'Rp 2.000';
                else if (priceRange === 'Rp 50.001 - Rp 100.000') fee = 'Rp 5.000';
                else if (priceRange === 'Rp 100.001 - Rp 300.000') fee = 'Rp 10.000';
                else if (priceRange === 'Rp 300.001 - Rp 500.000') fee = 'Rp 15.000';
                else if (priceRange === 'Rp 500.001 - Rp 1.000.000') fee = 'Rp 25.000';
                else if (priceRange === '> Rp 1.000.000') fee = '2% flat';

                const header = new TextDisplayBuilder()
                    .setContent(`## HAJI UTONG - Midman Logs\n\nThank you for using our middleman service.`);

                const headerSection = new SectionBuilder()
                    .addTextDisplayComponents(header)
                    .setThumbnailAccessory(thumbnail);

                const testimonialInfo = new TextDisplayBuilder()
                    .setContent(`**• Seller:** <@${sellerUser.id}> \`${sellerUser.id}\`\n**• Buyer:** <@${buyerUser.id}> \`${buyerUser.id}\`\n**• Harga:** ${formatRupiah(price)}`);

                const submittedBy = new TextDisplayBuilder()
                    .setContent(`**• Submitted by:** <@${interaction.user.id}>`);

                const testimonialContainer = new ContainerBuilder()
                    .setAccentColor(parseInt(config.primaryColor, 16))
                    .addSectionComponents(headerSection)
                    .addSeparatorComponents(sep)
                    .addTextDisplayComponents(testimonialInfo)
                    .addSeparatorComponents(sep)
                    .addTextDisplayComponents(submittedBy);

                // Send testimonial to midman-logs channel
                await midmanLogsChannel.send({
                    components: [testimonialContainer],
                    flags: MessageFlags.IsComponentsV2,
                });

                const successBlock = new ContainerBuilder()
                    .setAccentColor(parseInt(config.primaryColor, 16))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## ✅ Thank you\n\nYour testimonial has been submitted successfully!`)
                    );

                await interaction.editReply({
                    components: [successBlock],
                    flags: MessageFlags.IsComponentsV2,
                });

                logger.info(`[TESTIMONIAL-REKBER] Testimonial submitted by ${interaction.user.tag} - ${sellerUser.tag} ↔ ${buyerUser.tag} (${price} - ${priceRange})`);

            } else if (subcommand === 'joki') {
                // Check if it's a purchase ticket
                if (!interaction.channel.name.includes('purchase')) {
                    const errorBlock = new ContainerBuilder()
                        .setAccentColor(parseInt(config.primaryColor, 16))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('❌ Command can only be used in a purchase ticket!')
                        );
                    return await interaction.editReply({
                        components: [errorBlock],
                        flags: MessageFlags.IsComponentsV2,
                    });
                }

                const jokiChannel = await client.channels.fetch(config.channels.testimonialsJoki).catch(() => null);

                if (!jokiChannel) {
                    const errorBlock = new ContainerBuilder()
                        .setAccentColor(parseInt(config.primaryColor, 16))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('❌ Channel not found!')
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

                const header = new TextDisplayBuilder()
                    .setContent(`## HAJI UTONG - Testimoni\n\nThank you for using our service.\nWe hope you are satisfied with the results we provided!`);

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

                const testimonialContainer = new ContainerBuilder()
                    .setAccentColor(parseInt(config.primaryColor, 16))
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
                    .setAccentColor(parseInt(config.primaryColor, 16))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## ✅ Thank you\n\nYour testimonial has been submitted successfully!`)
                    );

                await interaction.editReply({
                    components: [successBlock],
                    flags: MessageFlags.IsComponentsV2,
                });

                logger.info(`[TESTIMONIAL-JOKI] Joki testimonial submitted by ${interaction.user.tag} - ${joki} → ${client_name}`);

            } else if (subcommand === 'transaksi') {
                // Check if it's a purchase ticket
                if (!interaction.channel.name.includes('purchase')) {
                    const errorBlock = new ContainerBuilder()
                        .setAccentColor(parseInt(config.primaryColor, 16))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('❌ Command can only be used in a purchase ticket!')
                        );
                    return await interaction.editReply({
                        components: [errorBlock],
                        flags: MessageFlags.IsComponentsV2,
                    });
                }

                const testimonialChannel = await client.channels.fetch(config.channels.testimonialsGeneral).catch(() => null);

                if (!testimonialChannel) {
                    const errorBlock = new ContainerBuilder()
                        .setAccentColor(parseInt(config.primaryColor, 16))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('❌ channel not found!')
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

                const header = new TextDisplayBuilder()
                    .setContent(`## HAJI UTONG - Testimoni\n\nThank you for shopping with us.\nWe hope you are satisfied with our service.`);

                const headerSection = new SectionBuilder()
                    .addTextDisplayComponents(header)
                    .setThumbnailAccessory(thumbnail);

                const transactionInfo = new TextDisplayBuilder()
                    .setContent(`• **Seller:** ${seller}\n• **Buyer:** ${buyer}`);

                const productInfo = new TextDisplayBuilder()
                    .setContent(`• **Product:** ${product}\n• **Price:** ${formatRupiah(price)}`);

                const mediaGallery = new MediaGalleryBuilder()
                    .addItems(new MediaGalleryItemBuilder().setURL(proof.url));

                const testimonialContainer = new ContainerBuilder()
                    .setAccentColor(parseInt(config.primaryColor, 16))
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
                    .setAccentColor(parseInt(config.primaryColor, 16))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## ✅ Thank you\n\nYour testimonial has been submitted successfully!`)
                    );

                await interaction.editReply({
                    components: [successBlock],
                    flags: MessageFlags.IsComponentsV2,
                });

                logger.info(`[TESTIMONIAL-TRANSAKSI] Testimonial submitted by ${interaction.user.tag} - ${seller} → ${buyer}`);
            }
        } catch (error) {
            console.error('[TESTIMONIAL ERROR]', error.message);
            const errorBlock = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
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
