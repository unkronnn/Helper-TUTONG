const { ActivityType, REST, Routes, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextDisplayBuilder, SeparatorBuilder, ContainerBuilder, MessageFlags, ThumbnailBuilder, SectionBuilder } = require('discord.js');
const colors = require('colors');
const config = require('../../config/config.json');

// Activity list
const activities = [
    { name: '/help untuk bantuan', type: ActivityType.Watching },
    { name: 'pesan dari user', type: ActivityType.Listening },
    { name: 'moderasi server', type: ActivityType.Playing },
    { name: 'warning logs', type: ActivityType.Watching }
];

let activityIndex = 0;

module.exports = {
    name: 'clientReady',
    once: true,
    execute(client) {
        const tag = client.user.tag;
        const boxTitle = `BOT READY`;
        const boxMessage = `Logged in as ${tag}`;
        const maxLength = Math.max(boxTitle.length, boxMessage.length) + 4;
        console.log(`╔${'─'.repeat(maxLength)}╗`);
        console.log(`║ ${boxTitle.padEnd(maxLength - 2)} ║`);
        console.log(`╠${'─'.repeat(maxLength)}╣`);
        console.log(`║ ${boxMessage.padEnd(maxLength - 2)} ║`);
        console.log(`╚${'─'.repeat(maxLength)}╝`);

        // Setup Server Stats channels
        setupServerStats(client);

        // Auto-send tickets embed
        autoSendTicketsEmbed(client);

        // Auto-send middleman embed
        autoSendMiddlemanEmbed(client);

        // Set initial activity
        updateActivity(client);

        // Rotate activity every 30 seconds
        setInterval(() => updateActivity(client), 30000);

        // Auto-update server stats every 10 seconds
        const statsInterval = setInterval(() => autoUpdateServerStats(client), 10000);
        console.log(colors.green('[STATS] ✓ Auto-update interval started (10 detik)'));

        // Auto-deploy slash commands
        deploySlashCommands(client);
    },
};
// Auto-send tickets embed to channel
async function autoSendTicketsEmbed(client) {
    try {
        const ticketChannel = await client.channels.fetch(config.ticketChannelId);

        if (!ticketChannel) {
            console.log(colors.yellow(`[TICKETS] Channel tidak ditemukan (ID: ${config.ticketChannelId})`));
            return;
        }

        // Delete semua pesan lama di channel
        try {
            const messages = await ticketChannel.messages.fetch({ limit: 100 });
            if (messages.size > 0) {
                await ticketChannel.bulkDelete(messages);
                console.log(colors.cyan(`[TICKETS] ✓ ${messages.size} pesan lama dihapus`));
            }
        } catch (deleteErr) {
            console.log(colors.yellow(`[TICKETS] Gagal hapus pesan lama: ${deleteErr.message}`));
        }

        // Build tickets embed dengan v2 components (samain serverinfo)
        const accentColor = parseInt(config.color.replace('#', ''), 16);
        const guild = ticketChannel.guild;
        const serverIconURL = guild.iconURL({ extension: 'png', size: 128 });

        // Header dengan server name dan icon
        const headerText = new TextDisplayBuilder()
            .setContent(`# **${guild.name}** - **Tickets System**`);

        const thumbnail = new ThumbnailBuilder({ media: { url: serverIconURL } });
        const headerSection = new SectionBuilder()
            .addTextDisplayComponents(headerText)
            .setThumbnailAccessory(thumbnail);

        const description = new TextDisplayBuilder()
            .setContent('Sebelum membuat ticket, pastikan kamu benar-benar memiliki kebutuhan atau keperluan yang jelas.');

        const warning = new TextDisplayBuilder()
            .setContent('## ⚠️ **Harap diperhatikan:**\n• Jangan membuat ticket hanya untuk iseng atau main-main, karena ini akan mengganggu staff kami!\n• Jika ticket kamu tidak dibalas dalam waktu yang lama, silahkan tag staff yang bertugas.');

        const rules = new TextDisplayBuilder()
            .setContent('## 📌 **Peraturan:**\nJika kamu ketahuan melanggar peraturan di atas, kami tidak akan segan-segan untuk memasukan kamu ke blacklist!');

        const sep = new SeparatorBuilder();

        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addSectionComponents(headerSection)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(description)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(warning)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(rules);

        const purchaseBtn = new ButtonBuilder()
            .setCustomId('ticket_purchase')
            .setLabel('Purchase')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💳');

        const helpBtn = new ButtonBuilder()
            .setCustomId('ticket_help')
            .setLabel('Bantuan')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❓');

        const buttonRow = new ActionRowBuilder()
            .addComponents(purchaseBtn, helpBtn);

        // Send embed
        const ticketMessage = await ticketChannel.send({
            components: [container, buttonRow],
            flags: MessageFlags.IsComponentsV2,
        });

        console.log(colors.green('[TICKETS] ✓ Embed tickets v2 auto-sent!'));
        console.log(colors.green(`[TICKETS] ✓ Message ID: ${ticketMessage.id}`));
        console.log(colors.green(`[TICKETS] ✓ Channel: #${ticketChannel.name}\n`));
    } catch (error) {
        console.error(colors.red('[TICKETS ERROR]'), error.message);
    }
}

// Auto-send middleman embed to channel
async function autoSendMiddlemanEmbed(client) {
    try {
        const middlemanChannel = await client.channels.fetch(config.middlemanChannelId);

        if (!middlemanChannel) {
            console.log(colors.yellow(`[MIDDLEMAN] Channel tidak ditemukan (ID: ${config.middlemanChannelId})`));
            return;
        }

        // Delete semua pesan lama di channel
        try {
            const messages = await middlemanChannel.messages.fetch({ limit: 100 });
            if (messages.size > 0) {
                await middlemanChannel.bulkDelete(messages);
                console.log(colors.cyan(`[MIDDLEMAN] ✓ ${messages.size} pesan lama dihapus`));
            }
        } catch (deleteErr) {
            console.log(colors.yellow(`[MIDDLEMAN] Gagal hapus pesan lama: ${deleteErr.message}`));
        }

        // Build middleman embed dengan v2 components
        const accentColor = parseInt(config.color.replace('#', ''), 16);
        const guild = middlemanChannel.guild;
        const serverIconURL = guild.iconURL({ extension: 'png', size: 128 });

        // Header dengan server name dan icon
        const headerText = new TextDisplayBuilder()
            .setContent(`# **${guild.name}** - **Middleman**`);

        const thumbnail = new ThumbnailBuilder({ media: { url: serverIconURL } });
        const headerSection = new SectionBuilder()
            .addTextDisplayComponents(headerText)
            .setThumbnailAccessory(thumbnail);

        const description = new TextDisplayBuilder()
            .setContent('Kami siap membantu menjamin keamanan transaksi kamu. Untuk membuat request middleman, silakan klik tombol di bawah dan lengkapi semua data yang diperlukan dengan akurat.');

        const pricingStructure = new TextDisplayBuilder()
            .setContent('## 💰 **Struktur Biaya Kami:**\n• Rp 10.000 - Rp 50.000 → Rp 2.000\n• Rp 50.001 - Rp 100.000 → Rp 5.000\n• Rp 100.001 - Rp 300.000 → Rp 10.000\n• Rp 300.001 - Rp 500.000 → Rp 15.000\n• Rp 500.001 - Rp 1.000.000 → Rp 25.000\n• > Rp 1.000.000 → 2% flat');

        const warning = new TextDisplayBuilder()
            .setContent('## 🚨 **Harap diperhatikan:**\n• Jangan membuat request hanya untuk iseng atau main-main\n• Pastikan data pembeli dan penjual sudah akurat\n• Hindari transaksi ilegal atau mencurigakan');

        const sep = new SeparatorBuilder();

        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addSectionComponents(headerSection)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(description)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(pricingStructure)
            .addSeparatorComponents(sep)
            .addTextDisplayComponents(warning);

        const requestBtn = new ButtonBuilder()
            .setCustomId('middleman_request')
            .setLabel('Open Ticket')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🤝');

        const buttonRow = new ActionRowBuilder()
            .addComponents(requestBtn);

        // Send embed
        const middlemanMessage = await middlemanChannel.send({
            components: [container, buttonRow],
            flags: MessageFlags.IsComponentsV2,
        });

        console.log(colors.green('[MIDDLEMAN] ✓ Embed middleman v2 auto-sent!'));
        console.log(colors.green(`[MIDDLEMAN] ✓ Message ID: ${middlemanMessage.id}`));
        console.log(colors.green(`[MIDDLEMAN] ✓ Channel: #${middlemanChannel.name}\n`));
    } catch (error) {
        console.error(colors.red('[MIDDLEMAN ERROR]'), error.message);
    }
}

// Function to update activity
function updateActivity(client) {
    const activity = activities[activityIndex];
    client.user.setPresence({
        status: 'online',
        activities: [activity],
    });
    activityIndex = (activityIndex + 1) % activities.length;
}


// Setup Server Stats channels
async function setupServerStats(client) {
    try {
        // Get first guild
        const guild = client.guilds.cache.first();
        if (!guild) {
            console.log(colors.yellow('[SERVER STATS] Guild tidak ditemukan'));
            return;
        }

        // Fetch members dengan timeout untuk pastikan cache ter-load (non-blocking)
        // Ini berjalan async di background tanpa menunggu selesai
        guild.members.fetch({ limit: 0 })
            .then(() => console.log(colors.green('[SERVER STATS] ✓ Member cache loaded')))
            .catch(err => console.log(colors.yellow(`[SERVER STATS] Member fetch warning: ${err.message}`)));

        // Jika config kosong, guide user
        if (!config.serverStatsCategoryId) {
            console.log(colors.yellow('[SERVER STATS] serverStatsCategoryId belum dikonfigurasi!'));
            console.log(colors.yellow('[SERVER STATS] Buat category "Server Stats" di server, dapatkan ID-nya, lalu update config.json'));
            return;
        }

        const category = guild.channels.cache.get(config.serverStatsCategoryId);
        if (!category || category.type !== ChannelType.GuildCategory) {
            console.log(colors.red(`[SERVER STATS] Category tidak ditemukan atau terhapus! (ID: ${config.serverStatsCategoryId})`));
            return;
        }

        console.log(colors.cyan('[SERVER STATS] Setting up channels...'));

        // Create or update All Members channel
        let allMembersChannel = category.children.cache.find(
            ch => ch.name.toLowerCase().includes('all members') && ch.type === ChannelType.GuildVoice
        );

        if (!allMembersChannel) {
            allMembersChannel = await category.guild.channels.create({
                name: `👥 All Members: ${guild.members.cache.filter(m => !m.user.bot).size}`,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: ['Connect']
                    }
                ]
            });
            console.log(colors.green('[SERVER STATS] ✓ All Members channel dibuat'));
        }

        // Create or update Buyers channel
        let buyersChannel = category.children.cache.find(
            ch => ch.name.toLowerCase().includes('buyer') && ch.type === ChannelType.GuildVoice
        );

        if (!buyersChannel) {
            const buyerCount = config.buyerRoleId ? guild.members.cache.filter(m => m.roles.cache.has(config.buyerRoleId)).size : 0;

            buyersChannel = await category.guild.channels.create({
                name: `👑 Buyers: ${buyerCount}`,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: ['Connect']
                    }
                ]
            });
            console.log(colors.green('[SERVER STATS] ✓ Buyers channel dibuat'));
        }

        // Create or update Bots channel
        let botsChannel = category.children.cache.find(
            ch => ch.name.toLowerCase().includes('bot') && ch.type === ChannelType.GuildVoice
        );

        if (!botsChannel) {
            const botCount = guild.members.cache.filter(m => m.user.bot).size;

            botsChannel = await category.guild.channels.create({
                name: `🤖 Bots: ${botCount}`,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: ['Connect']
                    }
                ]
            });
            console.log(colors.green('[SERVER STATS] ✓ Bots channel dibuat'));
        }

        console.log(colors.green('[SERVER STATS] ✓ Server Stats siap!\n'));
    } catch (error) {
        console.log(colors.red(`[SERVER STATS] ERROR: ${error.message}`));
    }
}

// Auto-update server stats for all guilds
async function autoUpdateServerStats(client) {
    try {
        for (const guild of client.guilds.cache.values()) {
            // Lewati jika config kosong
            if (!config.serverStatsCategoryId) {
                console.log(colors.yellow('[STATS] Config kosong, skip'));
                continue;
            }
            
            const category = guild.channels.cache.get(config.serverStatsCategoryId);
            if (!category) {
                console.log(colors.yellow(`[STATS] Category tidak ditemukan untuk guild ${guild.name}`));
                continue;
            }

            // Get stats channels
            const allMembersChannel = category.children.cache.find(
                ch => ch.name.toLowerCase().includes('all members') && ch.type === ChannelType.GuildVoice
            );

            const buyersChannel = category.children.cache.find(
                ch => ch.name.toLowerCase().includes('buyer') && ch.type === ChannelType.GuildVoice
            );

            const botsChannel = category.children.cache.find(
                ch => ch.name.toLowerCase().includes('bot') && ch.type === ChannelType.GuildVoice
            );

            // Update All Members (exclude bots)
            if (allMembersChannel) {
                const totalMembers = guild.members.cache.filter(m => !m.user.bot).size;
                const newName = `👥 All Members: ${totalMembers}`;
                
                if (allMembersChannel.name !== newName) {
                    await allMembersChannel.setName(newName).catch(err => {
                        console.error(`[STATS] Error updating All Members: ${err.message}`);
                    });
                    console.log(colors.green(`[STATS] ✓ Updated All Members: ${totalMembers}`));
                }
            }

            // Update Buyers (punya role buyer)
            if (buyersChannel) {
                const buyerCount = config.buyerRoleId ? guild.members.cache.filter(m => m.roles.cache.has(config.buyerRoleId)).size : 0;
                const newName = `👑 Buyers: ${buyerCount}`;
                
                if (buyersChannel.name !== newName) {
                    await buyersChannel.setName(newName).catch(err => {
                        console.error(`[STATS] Error updating Buyers: ${err.message}`);
                    });
                    console.log(colors.green(`[STATS] ✓ Updated Buyers: ${buyerCount}`));
                }
            }

            // Update Bots count
            if (botsChannel) {
                const botCount = guild.members.cache.filter(m => m.user.bot).size;
                const newName = `🤖 Bots: ${botCount}`;
                
                if (botsChannel.name !== newName) {
                    await botsChannel.setName(newName).catch(err => {
                        console.error(`[STATS] Error updating Bots: ${err.message}`);
                    });
                    console.log(colors.green(`[STATS] ✓ Updated Bots: ${botCount}`));
                }
            }
        }
    } catch (error) {
        console.error('[STATS] Error in autoUpdateServerStats:', error.message);
    }
}

async function deploySlashCommands(client) {
    try {
        const commands = Array.from(client.slash.values())
            .filter(cmd => cmd.data)
            .map(cmd => cmd.data.toJSON());

        if (commands.length === 0) {
            console.log(colors.yellow('[DEPLOY] Tidak ada command untuk di-deploy'));
            return;
        }

        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

        console.log(colors.cyan(`[DEPLOY] Deploying ${commands.length} command(s)...`));

        const data = process.env.GUILD_ID
            ? await rest.put(
                Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
                { body: commands }
              )
            : await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
              );

        console.log(colors.green(`[DEPLOY] ✓ ${data.length} command(s) berhasil di-deploy!\n`));
    } catch (error) {
        console.error(colors.red('[DEPLOY ERROR]'), error.message);
    }
}
