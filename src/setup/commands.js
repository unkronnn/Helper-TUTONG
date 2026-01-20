const { REST, Routes } = require('discord.js');
const colors = require('colors');
const setupLogger = require('./setupLogger');

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

        const data = process.env.GUILD_ID
            ? await rest.put(
                Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
                { body: commands }
              )
            : await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
              );

        setupLogger.logDeploy(data.length);
    } catch (error) {
        console.error(colors.red('[DEPLOY ERROR]'), error.message);
    }
}

module.exports = { deploySlashCommands };
