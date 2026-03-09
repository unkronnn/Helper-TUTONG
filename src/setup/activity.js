const { ActivityType } = require('discord.js');

const getActivities = () => {
    return [
        { name: 'Made with ⚡ by Envy', type: ActivityType.Playing }
    ];
};

let activityIndex = 0;

function updateActivity(client) {
    const activities = getActivities();
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
