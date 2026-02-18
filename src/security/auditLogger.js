/**
 * Audit Logger - Track semua sensitive bot activities
 * Untuk security investigation & compliance
 */

const fs = require('fs');
const path = require('path');

class AuditLogger {
    constructor(logsDir = './logs') {
        this.logsDir = logsDir;
        this.auditLogsDir = path.join(logsDir, 'audit');
        this.ensureLogsDir();
        this.activities = [];
    }

    /**
     * Ensure logs directory exists
     */
    ensureLogsDir() {
        if (!fs.existsSync(this.auditLogsDir)) {
            fs.mkdirSync(this.auditLogsDir, { recursive: true });
        }
    }

    /**
     * Log moderation action
     */
    logModerationAction(data) {
        const entry = {
            type: 'MODERATION',
            timestamp: new Date(),
            ...data,
            // Required fields: userId, guildId, action, target, reason
        };

        this.writeLog(entry);
        console.log(`[AUDIT-MOD] ${data.action} | User: ${data.userId} | Target: ${data.target} | Guild: ${data.guildId}`);
    }

    /**
     * Log permission change
     */
    logPermissionChange(data) {
        const entry = {
            type: 'PERMISSION_CHANGE',
            timestamp: new Date(),
            ...data,
            // Required fields: userId, guildId, targetId, targetType, change
        };

        this.writeLog(entry);
        console.log(`[AUDIT-PERM] ${data.targetType} permission changed | User: ${data.userId} | Guild: ${data.guildId}`);
    }

    /**
     * Log security event
     */
    logSecurityEvent(data) {
        const entry = {
            type: 'SECURITY_EVENT',
            timestamp: new Date(),
            severity: data.severity || 'WARNING',
            ...data,
            // Required fields: guildId, eventType, description
        };

        this.writeLog(entry);
        console.log(`[AUDIT-SEC][${entry.severity}] ${data.description} | Guild: ${data.guildId}`);
    }

    /**
     * Log command execution (detailed)
     */
    logCommandExecution(data) {
        const entry = {
            type: 'COMMAND_EXECUTION',
            timestamp: new Date(),
            ...data,
            // Required fields: userId, guildId, commandName, success
        };

        this.writeLog(entry);
    }

    /**
     * Log database operation
     */
    logDatabaseOperation(data) {
        const entry = {
            type: 'DATABASE_OPERATION',
            timestamp: new Date(),
            ...data,
            // Required fields: operation, collection, success
        };

        this.writeLog(entry);
    }

    /**
     * Log suspicious activity
     */
    logSuspiciousActivity(data) {
        const entry = {
            type: 'SUSPICIOUS_ACTIVITY',
            timestamp: new Date(),
            severity: 'HIGH',
            ...data,
            // Required fields: userId, guildId, activityType, description
        };

        this.writeLog(entry);
        console.error(`[AUDIT-ALERT][HIGH] ${data.description} | User: ${data.userId} | Guild: ${data.guildId}`);
    }

    /**
     * Log API call (untuk external services)
     */
    logAPICall(data) {
        const entry = {
            type: 'API_CALL',
            timestamp: new Date(),
            ...data,
            // Required fields: service, endpoint, statusCode, success
        };

        this.writeLog(entry);
    }

    /**
     * Write log entry ke file
     */
    writeLog(entry) {
        this.activities.push(entry);

        // Get current date untuk file naming
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const logFile = path.join(this.auditLogsDir, `audit-${dateStr}.jsonl`);

        try {
            // Append log entry (JSONL format)
            fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
        } catch (error) {
            console.error('[AUDIT LOG ERROR]', error);
        }
    }

    /**
     * Get logs by filter
     */
    getLogs(filter = {}, limit = 100) {
        return this.activities
            .filter(log => this.matchesFilter(log, filter))
            .slice(-limit)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Check filter match
     */
    matchesFilter(log, filter) {
        for (const [key, value] of Object.entries(filter)) {
            if (log[key] !== value) return false;
        }
        return true;
    }

    /**
     * Get logs by guild
     */
    getGuildLogs(guildId, limit = 100) {
        return this.getLogs({ guildId }, limit);
    }

    /**
     * Get logs by user
     */
    getUserLogs(userId, limit = 100) {
        return this.getLogs({ userId }, limit);
    }

    /**
     * Get security incidents
     */
    getSecurityIncidents(guildId) {
        return this.activities
            .filter(log => 
                log.guildId === guildId && 
                (log.type === 'SECURITY_EVENT' || log.type === 'SUSPICIOUS_ACTIVITY')
            )
            .slice(-50)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Export logs untuk investigation
     */
    exportLogs(filters = {}) {
        const logs = this.getLogs(filters, 10000);
        return {
            exported: new Date(),
            totalEntries: logs.length,
            logs: logs
        };
    }
}

module.exports = new AuditLogger();
