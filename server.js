require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 3000;

// Variable para controlar si ya se inicializó la DB
let isDbInitialized = false;

const initializeDatabase = async () => {
  if (isDbInitialized) {
    console.log('✅ Base de datos ya inicializada');
    return;
  }

  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida');
    
    // IMPORTANTE: Solo sincronizar en desarrollo, NUNCA en producción
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✅ Modelos sincronizados');
    }
    
    isDbInitialized = true;
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    // No lanzar error en Vercel para evitar que falle completamente
    if (process.env.VERCEL !== '1') {
      throw error;
    }
  }
};

const startServer = async () => {
  await initializeDatabase();

  // Iniciar servidor SOLO si NO estamos en Vercel (desarrollo local)
  if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
    });
  } else {
    console.log('✅ Aplicación lista para Vercel');
  }
};

// Solo iniciar en desarrollo local
if (process.env.VERCEL !== '1') {
  startServer().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
} else {
  // En Vercel, inicializar DB bajo demanda
  initializeDatabase().catch(error => {
    console.error('Error al inicializar DB:', error);
  });
}

// ⭐ CRÍTICO: Exportar app para Vercel
module.exports = app;
