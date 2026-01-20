const { ChannelType } = require('discord.js');
const colors = require('colors');
const config = require('../config/config.json');
const setupLogger = require('./setupLogger');

async function setupServerStats(client) {
    try {
        // Get first guild
        const guild = client.guilds.cache.first();
        if (!guild) {
            console.log(colors.yellow('[SERVER STATS] Guild tidak ditemukan'));
            return;
        }

        // Fetch members dengan timeout untuk pastikan cache ter-load (non-blocking)
        guild.members.fetch({ limit: 0 })
            .catch(err => console.log(colors.yellow(`[SERVER STATS] Member fetch warning: ${err.message}`)));

        // Jika config kosong, guide user
        if (!config.categories.serverStats) {
            console.log(colors.yellow('[SERVER STATS] serverStatsCategoryId belum dikonfigurasi!'));
            console.log(colors.yellow('[SERVER STATS] Buat category "Server Stats" di server, dapatkan ID-nya, lalu update config.json'));
            return;
        }

        const category = guild.channels.cache.get(config.categories.serverStats);
        if (!category || category.type !== ChannelType.GuildCategory) {
            console.log(colors.red(`[SERVER STATS] Category tidak ditemukan atau terhapus! (ID: ${config.categories.serverStats})`));
            return;
        }

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
        }

        // Create or update Buyers channel
        let buyersChannel = category.children.cache.find(
            ch => ch.name.toLowerCase().includes('buyer') && ch.type === ChannelType.GuildVoice
        );

        if (!buyersChannel) {
            const buyerCount = config.roles.buyer ? guild.members.cache.filter(m => m.roles.cache.has(config.roles.buyer)).size : 0;

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
        }

        setupLogger.logServerStats('complete', 'Stats channels setup');
    } catch (error) {
        console.log(colors.red(`[SERVER STATS] ERROR: ${error.message}`));
    }
}

async function autoUpdateServerStats(client) {
    try {
        for (const guild of client.guilds.cache.values()) {
            // Lewati jika config kosong
            if (!config.categories.serverStats) {
                console.log(colors.yellow('[STATS] Config kosong, skip'));
                continue;
            }
            
            const category = guild.channels.cache.get(config.categories.serverStats);
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
                const buyerCount = config.roles.buyer ? guild.members.cache.filter(m => m.roles.cache.has(config.roles.buyer)).size : 0;
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

function setupStats(client) {
    setupServerStats(client);
    
    setInterval(() => autoUpdateServerStats(client), 10000);
}

module.exports = { setupStats };
