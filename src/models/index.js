require('dotenv').config();
const { sequelize } = require('../config/database');
const User = require('./User');
const Product = require('./Product');

// Definir asociaciones
User.hasMany(Product, {
  foreignKey: 'createdBy',
  as: 'products'
});

Product.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

module.exports = {
  sequelize,
  User,
  Product
};