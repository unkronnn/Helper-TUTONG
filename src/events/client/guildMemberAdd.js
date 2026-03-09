const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    name: 'guildMemberAdd',
    execute(client, member) {
        // Send welcome message to welcome channel
        const welcomeChannelId = config.channels.welcome;

        if (!welcomeChannelId) {
            console.warn('[WELCOME] Welcome channel ID not configured');
            return;
        }

        const guild = client.guilds.cache.get(member.guild.id);
        if (!guild) {
            console.warn('[WELCOME] Guild not found');
            return;
        }

        const welcomeChannel = guild.channels.cache.get(welcomeChannelId);

        if (!welcomeChannel) {
            console.warn('[WELCOME] Welcome channel not found');
            return;
        }

        try {
            // Get guild icon
            const guildIconUrl = guild.iconURL({ size: 256, extension: 'png' });

            // Create verify button
            const verifyBtn = new ButtonBuilder()
                .setLabel('Verify Now')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.com/channels/1338437118296330292/1472800288715837684');

            const buttonRow = new ActionRowBuilder().addComponents(verifyBtn);

            // Create welcome embed (classic, transparent)
            const welcomeEmbed = new EmbedBuilder()
                .setDescription(
                    `# Welcome, ${member}!\n\n` +
                    `Selamat datang di **${guild.name}**!\n\n` +
                    `Untuk mengakses server, silakan verifikasi diri Anda terlebih dahulu.\n` +
                    `Klik tombol di bawah untuk melakukan verifikasi.`
                )
                .setThumbnail(guildIconUrl || null)
                .setColor(null) // Transparent - no color
                .setTimestamp();

            // Send embed with button
            welcomeChannel.send({
                content: `${member}`, // Tag the new member
                embeds: [welcomeEmbed],
                components: [buttonRow],
            }).then(() => {
                console.log(`[WELCOME] Welcome message sent to ${member.user.tag}`);
            }).catch(err => {
                console.error('[WELCOME] Failed to send welcome message:', err.message);
            });

        } catch (error) {
            console.error('[WELCOME] Error creating welcome message:', error.message);
        }
    },
};
