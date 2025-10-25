require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { sequelize } = require('./models');
const authController = require('./controllers/authController');
const comentariosRoutes = require('./routes/comentarios');
const fs = require('fs');

const app = express();

const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5501',
  process.env.FRONTEND_URL,
  'https://paella-giobel.netlify.app',
  'https://*.netlify.app'
].filter(Boolean);


const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`Origen no permitido por CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors());

app.use(helmet({
  contentSecurityPolicy: false,
  hsts: false
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400000,
    httpOnly: true,
    sameSite: 'lax',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  }
}));

require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const galleryRoutes = require('./routes/gallery'); // Importar rutas de galería
const accountsRoutes = require('./routes/accounts'); // Importar rutas de cuentas

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/comentarios', comentariosRoutes);
app.use('/api/gallery', galleryRoutes); // Usar rutas de galería
app.use('/api/accounts', accountsRoutes); // Usar rutas de cuentas

app.post('/api/auth/complete-profile', authController.completeProfile);

const staticOptions = {
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'public, max-age=31536000');
  },
  fallthrough: false
};
// Configuración de archivos estáticos
// Configurar middleware para archivos estáticos
// Configuración de archivos estáticos
// Servir el directorio 'client' como la raíz de la aplicación web
app.use(express.static(path.join(__dirname, '../client')));

// Servir directorios específicos dentro de 'client' bajo sus propias rutas
app.use('/img', express.static(path.join(__dirname, '../client/img'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=31536000');
  }
}));
app.use('/css', express.static(path.join(__dirname, '../client/css')));
app.use('/js', express.static(path.join(__dirname, '../client/js')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Mantener si 'uploads' es un directorio separado

// Rutas para archivos HTML específicos (si es necesario, de lo contrario, express.static ya los sirve)
app.get('/completar-perfil', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/completar-perfil.html'));
});

app.get('/login-error', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/login-error.html'));
});

// La ruta raíz '/' ya es manejada por express.static para index.html
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, '../client/index.html'));
// });

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      success: false,
      error: 'No autorizado' 
    });
  }
  res.status(500).json({ 
    success: false,
    error: 'Error interno del servidor' 
  });
});

// Esta ruta debe ir al final, después de todas las rutas y middlewares estáticos
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL exitosa');

    // Eliminar el tipo ENUM si existe para evitar el error "ya existe un tipo"
    // Esto es una solución temporal para el desarrollo. En producción, se usarían migraciones.
    try {
      await sequelize.query('DROP TYPE IF EXISTS "public"."enum_products_tipo";');
      console.log('🗑️ Tipo ENUM "enum_products_tipo" eliminado si existía.');
    } catch (error) {
      console.error('❌ Error al intentar eliminar el tipo ENUM:', error);
    }

    // Sincronizar modelos con la base de datos, añadiendo nuevas columnas si es necesario
    // Usar `alter: true` temporalmente para añadir la columna `displayName` y recrear el tipo ENUM.
    // Sincronizar modelos con la base de datos.
    // Se usa `alter: false` para evitar el error de tipo ENUM ya existente.
    // Si se necesitan nuevas columnas, se deben añadir manualmente o con migraciones.
    await sequelize.sync({ force: false }); 
    console.log('🔄 Modelos sincronizados');
    const PORT = process.env.PORT || 5500;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error de inicialización:', error);
    process.exit(1);
  }
}

initializeDatabase();

module.exports = app;
