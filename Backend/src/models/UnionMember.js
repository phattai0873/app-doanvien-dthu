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
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    gender: {
        type: DataTypes.ENUM('male', 'female'),
        defaultValue: 'male'
    },
    identityNumber: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING,
        validate: {
            isEmail: true
        }
    },
    phoneNumber: {
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
    }
}, {
    tableName: 'union_members',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['memberCode'] },
        { unique: true, fields: ['identityNumber'] },
        { unique: true, fields: ['memberCardNumber'] }
    ]
});

module.exports = UnionMember;
