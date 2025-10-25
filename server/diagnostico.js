require('dotenv').config();
const dns = require('dns');

console.log('🔍 DIAGNÓSTICO DE CONEXIÓN SUPABASE');

// Verificar configuración
console.log('\n📋 CONFIGURACIÓN:');
console.log({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  ssl: process.env.DB_SSL
});

// Probar resolución DNS
console.log('\n🌐 PRUEBA DNS:');
dns.lookup(process.env.DB_HOST, (err, address, family) => {
  if (err) {
    console.log('❌ Error DNS:', err.message);
    console.log('💡 Soluciones:');
    console.log('   1. Verifica tu conexión a internet');
    console.log('   2. Prueba cambiar DNS a 8.8.8.8');
    console.log('   3. Usa el Connection Pooling de Supabase');
  } else {
    console.log('✅ DNS resuelto correctamente');
    console.log('   IP:', address);
    console.log('   Family:', family);
  }
});

// Probar conexión TCP
console.log('\n🔌 PRUEBA CONEXIÓN TCP:');
const net = require('net');
const client = new net.Socket();
const timeout = 5000;

client.setTimeout(timeout);
client.connect(process.env.DB_PORT, process.env.DB_HOST, () => {
  console.log('✅ Conexión TCP exitosa');
  client.end();
});

client.on('timeout', () => {
  console.log('❌ Timeout en conexión TCP');
  client.destroy();
});

client.on('error', (err) => {
  console.log('❌ Error en conexión TCP:', err.message);
});