const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT,
    logging: console.log,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    define: {
      timestamps: true,
      underscored: true
    },
    // Agregar estas opciones para mejor conexión
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test de conexión
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL exitosa');
    
    // Verificar datos de conexión
    const [result] = await sequelize.query('SELECT current_database(), current_user');
    console.log('📊 Conectado a:', result[0].current_database);
    console.log('👤 Usuario:', result[0].current_user);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('🔍 Detalles:', {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      port: process.env.DB_PORT
    });
  }
})();

module.exports = { sequelize };