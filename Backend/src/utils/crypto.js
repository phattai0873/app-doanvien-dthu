const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'antigravity_default_secret_key_2026', 'salt', 32);

/**
 * Encrypt data using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {Object} - Object containing encryptedData, iv, and authTag
 */
const encrypt = (text) => {
    if (!text) return null;
    
    const iv = crypto.randomBytes(12); // GCM standard IV size is 12 bytes
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag
    };
};

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Hex encoded encrypted data
 * @param {string} iv - Hex encoded IV
 * @param {string} authTag - Hex encoded Auth Tag
 * @returns {string} - Decrypted plain text
 */
const decrypt = (encryptedData, iv, authTag) => {
    if (!encryptedData || !iv || !authTag) return null;
    
    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error.message);
        return null;
    }
};

module.exports = {
    encrypt,
    decrypt
};
