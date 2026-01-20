const { ActivityType } = require('discord.js');
const config = require('../config/config.json');

const getActivities = (client) => {
    const guild = client.guilds.cache.first();
    if (!guild) return [];
    
    const memberCount = guild.memberCount;
    const buyerRole = guild.roles.cache.get(config.roles.buyer);
    const buyerCount = buyerRole ? buyerRole.members.size : 0;
    
    return [
        { name: `${memberCount} members and ${buyerCount} buyers!`, type: ActivityType.Watching },
        { name: 'your transactions', type: ActivityType.Watching }
    ];
};

let activityIndex = 0;

function updateActivity(client) {
    const activities = getActivities(client);
    if (activities.length === 0) return;
    
    const activity = activities[activityIndex];
    client.user.setPresence({
        status: 'online',
        activities: [activity],
    });
    activityIndex = (activityIndex + 1) % activities.length;
}

function setupActivity(client) {
    updateActivity(client);
    setInterval(() => updateActivity(client), 30000);
}

module.exports = { setupActivity };
