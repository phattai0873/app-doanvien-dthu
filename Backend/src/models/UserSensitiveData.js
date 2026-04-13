const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');
const { encrypt, decrypt } = require('../utils/crypto');

/**
 * Dữ liệu nhạy cảm (CCCD, v.v...) - Đã mã hóa
 */
const UserSensitiveData = sequelize.define('UserSensitiveData', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    unionMemberId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true // Quan hệ 1-1
    },
    // Dữ liệu CCCD mã hóa GCM
    identityNumberEncrypted: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    iv: {
        type: DataTypes.STRING,
        allowNull: false
    },
    authTag: {
        type: DataTypes.STRING,
        allowNull: false
    },
    idIssueDate: {
        type: DataTypes.DATEONLY
    },
    idIssuePlace: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'user_sensitive_data',
    timestamps: true,
    hooks: {
        // Mã hóa trước khi lưu
        beforeSave: (instance) => {
            if (instance.changed('identityNumberPlain')) {
                const encrypted = encrypt(instance.identityNumberPlain);
                if (encrypted) {
                    instance.identityNumberEncrypted = encrypted.encryptedData;
                    instance.iv = encrypted.iv;
                    instance.authTag = encrypted.authTag;
                }
            }
        }
    }
});

// Virtual field cho việc gán dữ liệu chưa mã hóa
UserSensitiveData.prototype.setIdentityNumber = function(plainText) {
    this.identityNumberPlain = plainText;
    const encrypted = encrypt(plainText);
    if (encrypted) {
        this.identityNumberEncrypted = encrypted.encryptedData;
        this.iv = encrypted.iv;
        this.authTag = encrypted.authTag;
    }
};

// Phương thức tĩnh để mã hóa dữ liệu (Sử dụng cho tạo mới)
UserSensitiveData.encryptIdentityNumber = function(plainText) {
    return encrypt(plainText); // Trả về { encryptedData, iv, authTag }
};

// Phương pháp giải mã thủ công (Tránh auto-decrypt hook)
UserSensitiveData.prototype.getDecryptedIdentityNumber = function() {
    return decrypt(this.identityNumberEncrypted, this.iv, this.authTag);
};

module.exports = UserSensitiveData;
