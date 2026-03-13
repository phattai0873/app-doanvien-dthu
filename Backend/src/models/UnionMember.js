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
        allowNull: false,
        unique: true
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
        type: DataTypes.STRING
    },
    identityNumber: {
        type: DataTypes.STRING,
        unique: true
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
        type: DataTypes.STRING,
        unique: true
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
    approvedBy: {
        type: DataTypes.UUID,
        allowNull: true
    },
    unionBranchId: {
        type: DataTypes.UUID
    },
    unionCellId: {
        type: DataTypes.UUID
    },
    userId: {
        type: DataTypes.UUID
    }
}, {
    tableName: 'union_members',
    timestamps: true
});

module.exports = UnionMember;
