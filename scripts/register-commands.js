/**
 * Manual Slash Command Registration Script
 * Use this to manually force-register slash commands to Discord
 */

require('dotenv').config({ quiet: true });
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const colors = require('colors');

// Check .env
if (!process.env.TOKEN || !process.env.CLIENTID) {
    console.log(colors.red('ERROR: TOKEN or CLIENTID missing in .env'));
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
const slash = [];

console.log(colors.cyan('=== LOADING COMMANDS ===\n'));

fs.readdirSync('./src/commands/').forEach(dir => {
    const commands = fs.readdirSync(`./src/commands/${dir}`).filter(file => file.endsWith('.js'));

    for (let file of commands) {
        if (file === 'v2-components.js') continue;

        try {
            const commandModule = require(`../src/commands/${dir}/${file}`);

            if (commandModule.data && commandModule.data.constructor.name === 'SlashCommandBuilder') {
                slash.push(commandModule.data.toJSON());
                console.log(colors.green(`✅ Loaded: ${commandModule.data.name}`));
            }
        } catch (err) {
            console.log(colors.red(`❌ Error loading ${file}:`), err.message);
        }
    }
});

console.log(colors.cyan(`\n=== REGISTERING ${slash.length} COMMANDS TO DISCORD ===\n`));

rest.put(Routes.applicationCommands(process.env.CLIENTID), { body: slash })
    .then(data => {
        console.log(colors.green(`\n✅ SUCCESS! Registered ${data.length} commands to Discord!\n`));
        console.log(colors.yellow('Command List:'));
        data.forEach(cmd => {
            console.log(colors.white(`  • /${cmd.name}`));
        });
        console.log();
        process.exit(0);
    })
    .catch(err => {
        console.error(colors.red('\n❌ ERROR: Failed to register commands'));
        console.error(colors.red(err));
        process.exit(1);
    });
