const colors = require('colors');
const { setupActivity } = require('../../setup/activity');
const { setupTickets, setupMiddleman } = require('../../setup/ticketSetup');
const { setupStats } = require('../../setup/stats');
const { deploySlashCommands } = require('../../setup/commands');
const setupLogger = require('../../setup/setupLogger');

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

        // Setup all features
        setupActivity(client);
        setupTickets(client);
        setupMiddleman(client);
        setupStats(client);
        deploySlashCommands(client);

        // Print unified summary after a short delay
        setTimeout(() => {
            try {
                setupLogger.printSummary();
            } catch (err) {
                console.log('Summary print error:', err);
            }
        }, 300);
    },
};
