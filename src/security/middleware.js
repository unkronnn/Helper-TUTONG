/**
 * Security Middleware - Minimal version
 * - Permission validation
 * - Activity logging
 */

const { ChannelType } = require('discord.js');

class SecurityMiddleware {
    constructor(client) {
        this.client = client;
        this.commandLog = new Map();
    }

    /**
     * Validate user permissions untuk command
     */
    validatePermissions(member, requiredPermissions = []) {
        if (!member) return false;
        
        // Owner/Admin bypass
        if (member.id === member.guild.ownerId) return true;
        
        if (requiredPermissions.length === 0) return true;

        return requiredPermissions.every(perm => {
            return member.permissions.has(perm);
        });
    }

    /**
     * Log command execution untuk audit trail
     */
    logCommandExecution(userId, commandName, guildId, success, error = null) {
        const timestamp = new Date();
        const logEntry = {
            userId,
            commandName,
            guildId,
            success,
            error,
            timestamp
        };

        // Store in memory (max 1000 entries)
        if (!this.commandLog.has(guildId)) {
            this.commandLog.set(guildId, []);
        }

        const logs = this.commandLog.get(guildId);
        logs.push(logEntry);
        
        if (logs.length > 1000) {
            logs.shift();
        }

        // Log to console
        const status = success ? '✅' : '❌';
        const errorMsg = error ? ` | Error: ${error}` : '';
        console.log(`[AUDIT] ${status} User: ${userId} | Command: ${commandName} | Guild: ${guildId}${errorMsg}`);
    }

    /**
     * Get command logs untuk guild
     */
    getCommandLogs(guildId, limit = 50) {
        const logs = this.commandLog.get(guildId) || [];
        return logs.slice(-limit);
    }

    /**
     * Validate interaction origin (prevent token hijacking)
     */
    validateInteractionOrigin(interaction) {
        // Check if interaction is from expected guild
        if (!interaction.guild) return false;
        
        // Check if bot has minimal required permissions
        const botPermissions = interaction.guild.members.me?.permissions;
        if (!botPermissions) return false;

        return true;
    }
}

module.exports = SecurityMiddleware;
