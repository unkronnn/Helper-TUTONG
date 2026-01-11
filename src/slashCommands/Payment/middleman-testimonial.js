const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder } = require('@discordjs/builders');
const config = require('../../config/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('middleman-testimonial')
        .setDescription('Submit testimonial middleman')
        .addStringOption(option =>
            option
                .setName('buyer')
                .setDescription('Nama Buyer')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('seller')
                .setDescription('Nama Seller')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('price')
                .setDescription('Harga Asli Transaksi (contoh: Rp 50.000)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('price_range')
                .setDescription('Range Harga Transaksi')
                .setRequired(true)
                .addChoices(
                    { name: '💰 Rp 10.000 - Rp 50.000 (Biaya: Rp 2.000)', value: 'Rp 10.000 - Rp 50.000' },
                    { name: '💰 Rp 50.001 - Rp 100.000 (Biaya: Rp 5.000)', value: 'Rp 50.001 - Rp 100.000' },
                    { name: '💰 Rp 100.001 - Rp 300.000 (Biaya: Rp 10.000)', value: 'Rp 100.001 - Rp 300.000' },
                    { name: '💰 Rp 300.001 - Rp 500.000 (Biaya: Rp 15.000)', value: 'Rp 300.001 - Rp 500.000' },
                    { name: '💰 Rp 500.001 - Rp 1.000.000 (Biaya: Rp 25.000)', value: 'Rp 500.001 - Rp 1.000.000' },
                    { name: '💰 > Rp 1.000.000 (Biaya: 2% flat)', value: '> Rp 1.000.000' }
                )
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

            // Check if it's a middleman ticket
            if (!interaction.channel.name.includes('midman')) {
                const errorBlock = new ContainerBuilder()
                    .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ Command ini hanya bisa digunakan di middleman ticket!')
                    );
                return await interaction.reply({
                    components: [errorBlock],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const midmanLogsChannelId = config.midmanLogsChannelId || '1435337246214717612';
            const midmanLogsChannel = await client.channels.fetch(midmanLogsChannelId).catch(() => null);

            if (!midmanLogsChannel) {
                const errorBlock = new ContainerBuilder()
                    .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ Midman-logs channel tidak ditemukan!')
                    );
                return await interaction.editReply({
                    components: [errorBlock],
                    flags: MessageFlags.IsComponentsV2,
                });
            }

            const buyer = options.getString('buyer');
            const seller = options.getString('seller');
            const price = options.getString('price');
            const priceRange = options.getString('price_range');

            // Get server icon/logo
            const serverIcon = interaction.guild.iconURL({ size: 256, dynamic: true });
            const thumbnail = new ThumbnailBuilder({ media: { url: serverIcon } });

            const header = new TextDisplayBuilder()
                .setContent(`## Voxteria - Midman Logs\n\nThank you for using our middleman service.`);

            const headerSection = new SectionBuilder()
                .addTextDisplayComponents(header)
                .setThumbnailAccessory(thumbnail);

            const testimonialInfo = new TextDisplayBuilder()
                .setContent(`• **Buyer:** ${buyer}\n• **Seller:** ${seller}\n• **Harga:** ${price}\n• **Range:** ${priceRange}`);

            const submittedBy = new TextDisplayBuilder()
                .setContent(`• **Submitted by:** ${interaction.user.tag}`);

            const sep = new SeparatorBuilder();

            const testimonialContainer = new ContainerBuilder()
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
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
                .setAccentColor(parseInt(config.color.replace('#', ''), 16))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ✅ Thank you\n\nYour testimonial has been submitted successfully!`)
                );

            await interaction.editReply({
                components: [successBlock],
                flags: MessageFlags.IsComponentsV2,
            });

            logger.info(`[MIDDLEMAN-TESTIMONIAL] Testimonial submitted by ${interaction.user.tag} - ${buyer} ↔ ${seller} (${price} - ${priceRange})`);
        } catch (error) {
            console.error('[MIDDLEMAN-TESTIMONIAL ERROR]', error.message);
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


