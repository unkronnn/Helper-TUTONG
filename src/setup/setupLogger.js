const colors = require('colors');

// Initialize global logs storage
if (!global.setupLogs) {
    global.setupLogs = {
        serverStats: { status: null, details: [] },
        tickets: { status: null, details: [] },
        middleman: { status: null, details: [] },
        deploy: { status: null, details: [] },
        startTime: Date.now()
    };
}

const setupLogger = {
    // Log server stats setup
    logServerStats(stage, message) {
        if (!global.setupLogs.serverStats.details.includes(message)) {
            global.setupLogs.serverStats.details.push(message);
        }
        if (stage === 'complete') {
            global.setupLogs.serverStats.status = 'success';
        }
    },

    // Log tickets setup
    logTickets(messageId, channelName, messageCount) {
        global.setupLogs.tickets.details.push({
            messageId,
            channelName,
            messageCount
        });
        global.setupLogs.tickets.status = 'success';
    },

    // Log middleman setup
    logMiddleman(messageId, channelName, messageCount) {
        global.setupLogs.middleman.details.push({
            messageId,
            channelName,
            messageCount
        });
        global.setupLogs.middleman.status = 'success';
    },

    // Log commands deploy
    logDeploy(count) {
        global.setupLogs.deploy.details = count;
        global.setupLogs.deploy.status = 'success';
    },

    // Print unified summary
    printSummary() {
        const logs = global.setupLogs;
        const totalTime = ((Date.now() - logs.startTime) / 1000).toFixed(2);

        console.log('\n' + colors.cyan('═'.repeat(60)));
        console.log(colors.cyan('  SETUP SUMMARY'));
        console.log(colors.cyan('═'.repeat(60)));

        // Server Stats
        if (logs.serverStats.status === 'success') {
            console.log(colors.green('  ✓ SERVER STATS'));
            console.log(colors.gray('    • Stats channels configured'));
        }

        // Tickets
        if (logs.tickets.status === 'success' && logs.tickets.details.length > 0) {
            const ticketInfo = logs.tickets.details[0];
            console.log(colors.green('  ✓ TICKETS'));
            if (ticketInfo.messageCount > 0) {
                console.log(colors.gray(`    • Removed ${ticketInfo.messageCount} old messages`));
            }
            console.log(colors.gray(`    • Message ID: ${ticketInfo.messageId}`));
            console.log(colors.gray(`    • Channel: #${ticketInfo.channelName}`));
        }

        // Middleman
        if (logs.middleman.status === 'success' && logs.middleman.details.length > 0) {
            const mmInfo = logs.middleman.details[0];
            console.log(colors.green('  ✓ MIDDLEMAN'));
            if (mmInfo.messageCount > 0) {
                console.log(colors.gray(`    • Removed ${mmInfo.messageCount} old messages`));
            }
            console.log(colors.gray(`    • Message ID: ${mmInfo.messageId}`));
            console.log(colors.gray(`    • Channel: #${mmInfo.channelName}`));
        }

        // Commands Deploy
        if (logs.deploy.status === 'success' && logs.deploy.details) {
            console.log(colors.green(`  ✓ COMMANDS`));
            console.log(colors.gray(`    • ${logs.deploy.details} command(s) deployed`));
        }

        // Footer
        console.log(colors.cyan('═'.repeat(60)));
        console.log(colors.yellow(`  Setup completed in ${totalTime}s\n`));
    }
};

module.exports = setupLogger;
