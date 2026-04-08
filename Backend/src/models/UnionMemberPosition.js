const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const UnionMemberPosition = sequelize.define('UnionMemberPosition', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    assignedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    endedDate: {
        type: DataTypes.DATE
    },
    unionBranchId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    unionCellId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'union_member_positions',
    timestamps: true,
    hooks: {
        beforeSave: (instance) => {
            ['assignedDate', 'endedDate'].forEach(field => {
                const val = instance[field];
                if (val) {
                    if (typeof val === 'string' && val.toLowerCase().includes('invalid')) {
                        instance[field] = null;
                    } else {
                        const d = new Date(val);
                        if (isNaN(d.getTime())) {
                            instance[field] = null;
                        }
                    }
                }
            });
        }
    }
});

module.exports = UnionMemberPosition;
