require('dotenv').config();

console.log("🔍 Verificando configuración:");
console.log({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL
});

const { sequelize } = require('./config/database');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a Supabase exitosa!');
    
    // Probar consultas
    const [users] = await sequelize.query('SELECT COUNT(*) as total FROM users');
    const [products] = await sequelize.query('SELECT COUNT(*) as total FROM products');
    const [comments] = await sequelize.query('SELECT COUNT(*) as total FROM comentarios');
    
    console.log('📊 Datos en la base de datos:');
    console.log(`   👥 Usuarios: ${users[0].total}`);
    console.log(`   🍛 Productos: ${products[0].total}`);
    console.log(`   💬 Comentarios: ${comments[0].total}`);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('🔍 Detalles del error:', error.original || error);
  } finally {
    await sequelize.close();
  }
}

testConnection();