const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const UnionMember = sequelize.define('UnionMember', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    memberCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: true }
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    gender: {
        type: DataTypes.ENUM('male', 'female'),
        defaultValue: 'male'
    },
    identityNumber: {
        type: DataTypes.STRING
    },
    permanentAddress: {
        type: DataTypes.TEXT
    },
    hometown: {
        type: DataTypes.TEXT
    },
    joinedDate: {
        type: DataTypes.DATEONLY
    },
    officialDate: {
        type: DataTypes.DATEONLY
    },
    memberCardNumber: {
        type: DataTypes.STRING
    },
    joinedPlace: {
        type: DataTypes.STRING
    },
    educationLevel: {
        type: DataTypes.STRING
    },
    politicalTheoryLevel: {
        type: DataTypes.STRING
    },
    occupation: {
        type: DataTypes.STRING
    },
    ethnicity: {
        type: DataTypes.STRING,
        defaultValue: 'Kinh'
    },
    religion: {
        type: DataTypes.STRING,
        defaultValue: 'Không'
    },
    // Trình độ
    professionalLevel: {
        type: DataTypes.STRING, // Trình độ chuyên môn
        comment: 'Trình độ chuyên môn (Đại học, Thạc sĩ,...)'
    },
    itLevel: {
        type: DataTypes.STRING,
        comment: 'Trình độ Tin học'
    },
    languageLevel: {
        type: DataTypes.STRING,
        comment: 'Trình độ Ngoại ngữ'
    },
    memberType: {
        type: DataTypes.ENUM('STUDENT', 'STAFF', 'TEACHER', 'OTHER'),
        defaultValue: 'STUDENT'
    },
    isHonoraryMember: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
    },
    activityStatus: {
        type: DataTypes.ENUM('active', 'transferred', 'graduated', 'paused'),
        defaultValue: 'active'
    },
    roleInUnion: {
        type: DataTypes.ENUM('member', 'vice_secretary', 'secretary', 'commissioner'),
        defaultValue: 'member'
    },
    approvedBy: {
        type: DataTypes.UUID,
        allowNull: true
    },
    unionCellId: {
        type: DataTypes.UUID
    },
    userId: {
        type: DataTypes.UUID
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    socialWorkDays: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    isActivated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    activatedAt: {
        type: DataTypes.DATE
    },
    failedAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lockedUntil: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'union_members',
    timestamps: true,
    paranoid: true,
    indexes: [
        { unique: true, fields: ['memberCode'] },
        { unique: true, fields: ['identityNumber'] },
        { unique: true, fields: ['memberCardNumber'] },
        { fields: ['unionCellId'] },
        { fields: ['status'] },
        { fields: ['activityStatus'] },
        { unique: true, fields: ['userId'] }
    ],
    hooks: {
        beforeSave: (member) => {
            ['dateOfBirth', 'joinedDate', 'officialDate'].forEach(field => {
                const val = member[field];
                if (val) {
                    // Nếu là string chứa "invalid" hoặc khi parse ra NaN
                    if (typeof val === 'string' && val.toLowerCase().includes('invalid')) {
                        member[field] = null;
                    } else {
                        const d = new Date(val);
                        if (isNaN(d.getTime())) {
                            member[field] = null;
                        }
                    }
                }
            });
        }
    }
});

module.exports = UnionMember;
