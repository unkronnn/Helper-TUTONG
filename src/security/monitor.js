/**
 * Security Monitor - Real-time monitoring & alerting
 * Detects & responds to suspicious activities
 */

const auditLogger = require('./auditLogger');
const SecurityMiddleware = require('./middleware');

class SecurityMonitor {
    constructor(client) {
        this.client = client;
        this.alerts = [];
        this.thresholds = {
            failedCommandsPerMinute: 5,
            suspiciousActivitiesPerFiveMin: 10,
            unauthorizedAccessAttempts: 3,
            rateLimitViolations: 10
        };
    }

    /**
     * Check for suspicious patterns
     */
    analyzeBehavior(userId, guildId, activityType, data = {}) {
        const patterns = {
            'mass_moderation': this.checkMassModerationPattern,
            'permission_abuse': this.checkPermissionAbusePattern,
            'database_scanning': this.checkDatabaseScanningPattern,
            'token_hijacking': this.checkTokenHijackingPattern,
            'automated_attack': this.checkAutomatedAttackPattern
        };

        if (patterns[activityType]) {
            const result = patterns[activityType].call(this, userId, guildId, data);
            if (result.suspicious) {
                this.triggerAlert(result);
            }
            return result;
        }

        return { suspicious: false };
    }

    /**
     * Detect mass moderation (ban/kick spree)
     */
    checkMassModerationPattern(userId, guildId, data) {
        // Check logs untuk recent moderation actions
        const logs = auditLogger.getGuildLogs(guildId);
        const recentModActions = logs
            .filter(log => 
                log.type === 'MODERATION' && 
                log.userId === userId &&
                log.timestamp > new Date(Date.now() - 300000) // 5 minutes
            )
            .length;

        if (recentModActions > 20) {
            return {
                suspicious: true,
                pattern: 'MASS_MODERATION',
                severity: 'HIGH',
                details: `${recentModActions} moderation actions in 5 minutes`,
                userId,
                guildId
            };
        }

        return { suspicious: false };
    }

    /**
     * Detect permission escalation
     */
    checkPermissionAbusePattern(userId, guildId, data) {
        const logs = auditLogger.getGuildLogs(guildId);
        const permChanges = logs
            .filter(log => 
                log.type === 'PERMISSION_CHANGE' && 
                log.userId === userId &&
                log.timestamp > new Date(Date.now() - 600000) // 10 minutes
            )
            .length;

        if (permChanges > 5) {
            return {
                suspicious: true,
                pattern: 'PERMISSION_ABUSE',
                severity: 'HIGH',
                details: `${permChanges} permission changes in 10 minutes`,
                userId,
                guildId
            };
        }

        return { suspicious: false };
    }

    /**
     * Detect database scanning (trying to access unauthorized data)
     */
    checkDatabaseScanningPattern(userId, guildId, data) {
        const logs = auditLogger.getUserLogs(userId);
        const failedQueries = logs
            .filter(log =>
                log.type === 'DATABASE_OPERATION' &&
                !log.success &&
                log.timestamp > new Date(Date.now() - 60000) // 1 minute
            )
            .length;

        if (failedQueries > 10) {
            return {
                suspicious: true,
                pattern: 'DATABASE_SCANNING',
                severity: 'MEDIUM',
                details: `${failedQueries} failed database operations in 1 minute`,
                userId,
                guildId
            };
        }

        return { suspicious: false };
    }

    /**
     * Detect token hijacking signs
     */
    checkTokenHijackingPattern(userId, guildId, data) {
        const logs = auditLogger.getGuildLogs(guildId);
        const suspiciousActions = logs
            .filter(log =>
                log.type === 'SECURITY_EVENT' &&
                log.severity === 'HIGH' &&
                log.timestamp > new Date(Date.now() - 300000) // 5 minutes
            )
            .length;

        if (suspiciousActions > 5) {
            return {
                suspicious: true,
                pattern: 'POSSIBLE_TOKEN_HIJACK',
                severity: 'CRITICAL',
                details: `Multiple critical security events detected`,
                userId,
                guildId
            };
        }

        return { suspicious: false };
    }

    /**
     * Detect automated attacks
     */
    checkAutomatedAttackPattern(userId, guildId, data) {
        const logs = auditLogger.getGuildLogs(guildId);
        const rapidActions = logs
            .filter(log =>
                log.userId === userId &&
                log.timestamp > new Date(Date.now() - 10000) // 10 seconds
            )
            .length;

        if (rapidActions > 15) {
            return {
                suspicious: true,
                pattern: 'AUTOMATED_ATTACK',
                severity: 'HIGH',
                details: `${rapidActions} actions in 10 seconds (possible bot attack)`,
                userId,
                guildId
            };
        }

        return { suspicious: false };
    }

    /**
     * Trigger security alert
     */
    triggerAlert(alert) {
        this.alerts.push({
            ...alert,
            triggeredAt: new Date()
        });

        console.error(`\n⚠️  SECURITY ALERT [${alert.severity}]`);
        console.error(`Pattern: ${alert.pattern}`);
        console.error(`Details: ${alert.details}`);
        console.error(`User: ${alert.userId} | Guild: ${alert.guildId}\n`);

        // Log to audit
        auditLogger.logSuspiciousActivity({
            userId: alert.userId,
            guildId: alert.guildId,
            activityType: alert.pattern,
            description: alert.details,
            severity: alert.severity
        });

        // If critical, might want to take action
        if (alert.severity === 'CRITICAL') {
            this.handleCriticalAlert(alert);
        }
    }

    /**
     * Handle critical security incidents
     */
    async handleCriticalAlert(alert) {
        try {
            // Optionally disable suspicious user's bot access temporarily
            // Notify guild owner
            // Create incident report
            console.log('[CRITICAL] Incident handlers should be configured');
        } catch (error) {
            console.error('[CRITICAL HANDLER ERROR]', error);
        }
    }

    /**
     * Get security report untuk guild
     */
    getSecurityReport(guildId) {
        const incidents = auditLogger.getSecurityIncidents(guildId);
        const allGuildLogs = auditLogger.getGuildLogs(guildId, 1000);

        return {
            guildId,
            generatedAt: new Date(),
            totalIncidents: incidents.length,
            recentIncidents: incidents.slice(-10),
            securityScore: this.calculateSecurityScore(allGuildLogs),
            recommendations: this.generateRecommendations(allGuildLogs, incidents)
        };
    }

    /**
     * Calculate security score (0-100)
     */
    calculateSecurityScore(logs) {
        let score = 100;

        const criticalEvents = logs.filter(l => l.type === 'SUSPICIOUS_ACTIVITY').length;
        const failedOperations = logs.filter(l => !l.success).length;

        score -= criticalEvents * 5;
        score -= failedOperations * 1;

        return Math.max(0, score);
    }

    /**
     * Generate security recommendations
     */
    generateRecommendations(logs, incidents) {
        const recommendations = [];

        if (incidents.length > 5) {
            recommendations.push('⚠️  Frequent security incidents detected. Review guild permissions and audit logs.');
        }

        const suspiciousUsers = [...new Set(
            incidents
                .filter(i => i.userId)
                .map(i => i.userId)
        )];

        if (suspiciousUsers.length > 0) {
            recommendations.push(`Review permissions for users: ${suspiciousUsers.join(', ')}`);
        }

        if (logs.some(l => l.type === 'PERMISSION_CHANGE' && l.timestamp > new Date(Date.now() - 3600000))) {
            recommendations.push('Recent permission changes detected. Verify they are authorized.');
        }

        return recommendations.length > 0 ? recommendations : ['✅ No security issues detected'];
    }

    /**
     * Get recent alerts
     */
    getRecentAlerts(limit = 20) {
        return this.alerts.slice(-limit).reverse();
    }
}

module.exports = SecurityMonitor;
