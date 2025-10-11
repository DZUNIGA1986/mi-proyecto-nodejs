const { Sequelize } = require('sequelize');

// Configuración de la base de datos
const sequelize = new Sequelize(
  process.env.DB_NAME || 'postgres',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    
    define: {
      freezeTableName: true,
      underscored: true,
      timestamps: true
    }
  }
);

// Función para conectar (compatible con tu server.js)
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    
    // Para desarrollo, usar force: true solo si es necesario
    const syncOptions = process.env.NODE_ENV === 'development' 
      ? { force: false, alter: true } 
      : { alter: false };
      
    await sequelize.sync(syncOptions);
    console.log('✅ PostgreSQL conectado correctamente');
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    throw error;
  }
};

module.exports = connectDB;

// También exportar sequelize para los modelos
module.exports.sequelize = sequelize;