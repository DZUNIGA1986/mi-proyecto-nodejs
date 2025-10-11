const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(100),
        primaryKey: true,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'category',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Category;