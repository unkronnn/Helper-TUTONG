/**
 * Input Sanitizer - Prevent Injection Attacks & Malicious Input
 */

const DANGEROUS_PATTERNS = {
    mongodbInjection: /\$[a-zA-Z0-9_]+/g,
    codeInjection: /<script|javascript:|on\w+\s*=/gi,
    sqlInjection: /('|(--)|;|\/\*|\*\/|xp_|sp_)/gi,
    discordMention: /<@!?&?[0-9]+>/g,
};

class InputSanitizer {
    /**
     * Sanitize string input
     */
    static sanitizeString(input, options = {}) {
        if (typeof input !== 'string') return input;

        let sanitized = input.trim();

        // Remove excessive whitespace
        sanitized = sanitized.replace(/\s+/g, ' ');

        // Limit length
        const maxLength = options.maxLength || 1000;
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        // Encode special characters
        sanitized = this.escapeHtml(sanitized);

        return sanitized;
    }

    /**
     * Validate user input untuk safety
     */
    static validateInput(input, type = 'string') {
        if (input === null || input === undefined) {
            return { valid: false, error: 'Input cannot be null or undefined' };
        }

        switch (type) {
            case 'string':
                return this.validateString(input);
            case 'userId':
                return this.validateUserId(input);
            case 'guildId':
                return this.validateGuildId(input);
            case 'channelId':
                return this.validateChannelId(input);
            case 'roleId':
                return this.validateRoleId(input);
            case 'url':
                return this.validateUrl(input);
            default:
                return { valid: true };
        }
    }

    /**
     * Validate string input
     */
    static validateString(input) {
        if (typeof input !== 'string') {
            return { valid: false, error: 'Input must be a string' };
        }

        if (input.length === 0) {
            return { valid: false, error: 'Input cannot be empty' };
        }

        if (input.length > 1000) {
            return { valid: false, error: 'Input exceeds maximum length (1000 chars)' };
        }

        // Check for dangerous patterns
        if (this.containsDangerousPattern(input)) {
            return { valid: false, error: 'Input contains potentially dangerous content' };
        }

        return { valid: true };
    }

    /**
     * Validate Discord user ID
     */
    static validateUserId(input) {
        if (!/^\d{17,20}$/.test(input)) {
            return { valid: false, error: 'Invalid user ID format' };
        }
        return { valid: true };
    }

    /**
     * Validate Discord guild ID
     */
    static validateGuildId(input) {
        if (!/^\d{17,20}$/.test(input)) {
            return { valid: false, error: 'Invalid guild ID format' };
        }
        return { valid: true };
    }

    /**
     * Validate Discord channel ID
     */
    static validateChannelId(input) {
        if (!/^\d{17,20}$/.test(input)) {
            return { valid: false, error: 'Invalid channel ID format' };
        }
        return { valid: true };
    }

    /**
     * Validate Discord role ID
     */
    static validateRoleId(input) {
        if (!/^\d{17,20}$/.test(input)) {
            return { valid: false, error: 'Invalid role ID format' };
        }
        return { valid: true };
    }

    /**
     * Validate URL
     */
    static validateUrl(input) {
        try {
            new URL(input);
            return { valid: true };
        } catch {
            return { valid: false, error: 'Invalid URL format' };
        }
    }

    /**
     * Check untuk dangerous patterns
     */
    static containsDangerousPattern(input) {
        return Object.values(DANGEROUS_PATTERNS).some(pattern => {
            return pattern.test(input);
        });
    }

    /**
     * Escape HTML characters
     */
    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Sanitize mention dalam string (remove atau mask)
     */
    static sanitizeMentions(input, mode = 'remove') {
        if (mode === 'remove') {
            return input.replace(DANGEROUS_PATTERNS.discordMention, '[mention]');
        }
        return input;
    }

    /**
     * Batch sanitize objects
     */
    static sanitizeObject(obj, schema = {}) {
        const sanitized = {};

        for (const [key, value] of Object.entries(obj)) {
            if (schema[key]) {
                const validation = this.validateInput(value, schema[key]);
                if (!validation.valid) {
                    continue; // Skip invalid fields
                }
            }

            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }
}

module.exports = InputSanitizer;
