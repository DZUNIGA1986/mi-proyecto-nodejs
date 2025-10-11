require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models'); // Importar desde models/index.js

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Probar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida');

    // Sincronizar modelos
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados');

    // Iniciar servidor SOLO si NO estamos en Vercel
    if (process.env.VERCEL !== '1') {
      app.listen(PORT, () => {
        console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
        console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
        console.log(`📍 URL: http://localhost:${PORT}`);
      });
    } else {
      console.log('✅ Aplicación lista para Vercel');
    }
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    // En Vercel, no queremos que se detenga el proceso
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
  }
};

// Iniciar el servidor
startServer();

// ⭐ IMPORTANTE: Exportar app para Vercel
module.exports = app;
