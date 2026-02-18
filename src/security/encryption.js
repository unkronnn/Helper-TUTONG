/**
 * Encryption Utility - Untuk encrypt/decrypt sensitive data
 * Used for storing sensitive information in database
 */

const crypto = require('crypto');
require('dotenv').config({ quiet: true });

class EncryptionUtil {
    constructor() {
        // Generate encryption key dari environment
        // IMPORTANT: Store this securely, never hardcode!
        this.encryptionKey = this.deriveKey(process.env.TOKEN || 'default-key');
    }

    /**
     * Derive encryption key dari token
     */
    deriveKey(secret) {
        return crypto
            .createHash('sha256')
            .update(String(secret))
            .digest();
    }

    /**
     * Encrypt data
     */
    encrypt(text) {
        try {
            if (!text) return null;

            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);

            let encrypted = cipher.update(String(text), 'utf8', 'hex');
            encrypted += cipher.final('hex');

            // Combine IV + encrypted data
            return iv.toString('hex') + ':' + encrypted;
        } catch (error) {
            console.error('[ENCRYPTION ERROR]', error);
            return null;
        }
    }

    /**
     * Decrypt data
     */
    decrypt(encryptedData) {
        try {
            if (!encryptedData) return null;

            const [ivHex, encrypted] = encryptedData.split(':');
            if (!ivHex || !encrypted) return null;

            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.error('[DECRYPTION ERROR]', error);
            return null;
        }
    }

    /**
     * Hash sensitive data (one-way)
     */
    hash(text) {
        return crypto
            .createHash('sha256')
            .update(String(text))
            .digest('hex');
    }

    /**
     * Generate secure random token
     */
    generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Encrypt object
     */
    encryptObject(obj) {
        try {
            const jsonString = JSON.stringify(obj);
            return this.encrypt(jsonString);
        } catch (error) {
            console.error('[OBJECT ENCRYPTION ERROR]', error);
            return null;
        }
    }

    /**
     * Decrypt object
     */
    decryptObject(encryptedData) {
        try {
            const decrypted = this.decrypt(encryptedData);
            if (!decrypted) return null;
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('[OBJECT DECRYPTION ERROR]', error);
            return null;
        }
    }

    /**
     * Verify integrity of data (HMAC)
     */
    generateHMAC(data) {
        return crypto
            .createHmac('sha256', this.encryptionKey)
            .update(String(data))
            .digest('hex');
    }

    /**
     * Verify HMAC signature
     */
    verifyHMAC(data, signature) {
        const expected = this.generateHMAC(data);
        return crypto.timingSafeEqual(
            Buffer.from(expected),
            Buffer.from(signature)
        );
    }
}

module.exports = new EncryptionUtil();
