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

// ✅ CONFIGURACIÓN CRÍTICA PARA RAILWAY - DEBE IR AL INICIO
app.set('trust proxy', 1);

const allowedOrigins = [
  'https://paella-giobel.onrender.com',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5501',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://velvety-cat-86306e.netlify.app',
  'https://68fc8979b1246f00086fa133--velvety-cat-86306e.netlify.app',
  'https://*.netlify.app',
  process.env.FRONTEND_URL
].filter(Boolean);

// ✅ CONFIGURACIÓN RATE LIMIT CORRECTA
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas solicitudes desde esta IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuración CORS COMPLETA Y FUNCIONAL
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (origin === allowedOrigin) return true;
      
      if (allowedOrigin.includes('*')) {
        const domain = allowedOrigin.replace('*.', '');
        return origin.endsWith(domain);
      }
      
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('🚫 Origen bloqueado por CORS:', origin);
      console.log('✅ Orígenes permitidos:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'X-Requested-With',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Aplicar middlewares en ORDEN CORRECTO
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(helmet({
  contentSecurityPolicy: false,
  hsts: false
}));
app.use(limiter); // ✅ Rate limit aplicado después de CORS
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
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  }
}));

require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// Middleware adicional para headers CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.some(allowed => {
    if (allowed.includes('*')) {
      return origin.endsWith(allowed.replace('*.', ''));
    }
    return origin === allowed;
  })) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const galleryRoutes = require('./routes/gallery');
const accountsRoutes = require('./routes/accounts');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/comentarios', comentariosRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/accounts', accountsRoutes);

// Ruta de prueba CORS
app.get('/api/test-cors', (req, res) => {
  res.json({
    message: '✅ CORS funcionando correctamente',
    timestamp: new Date().toISOString(),
    allowedOrigins: allowedOrigins,
    yourOrigin: req.headers.origin
  });
});

app.post('/api/auth/complete-profile', authController.completeProfile);

// Configuración de archivos estáticos
app.use(express.static(path.join(__dirname, '../client')));

app.use('/img', express.static(path.join(__dirname, '../client/img'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=31536000');
  }
}));
app.use('/css', express.static(path.join(__dirname, '../client/css')));
app.use('/js', express.static(path.join(__dirname, '../client/js')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas para archivos HTML específicos
app.get('/completar-perfil', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/completar-perfil.html'));
});

app.get('/login-error', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/login-error.html'));
});

// Manejo de errores CORS específico
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origen no permitido',
      yourOrigin: req.headers.origin,
      allowedOrigins: allowedOrigins
    });
  }
  next(err);
});

// Manejo general de errores
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
    try {
      await sequelize.query('DROP TYPE IF EXISTS "public"."enum_products_tipo";');
      console.log('🗑️ Tipo ENUM "enum_products_tipo" eliminado si existía.');
    } catch (error) {
      console.error('❌ Error al intentar eliminar el tipo ENUM:', error);
    }

    // Sincronizar modelos con la base de datos
    await sequelize.sync({ force: false }); 
    console.log('🔄 Modelos sincronizados');
    
    const PORT = process.env.PORT || 5500;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
      console.log(`✅ CORS configurado para:`, allowedOrigins);
    });
  } catch (error) {
    console.error('❌ Error de inicialización:', error);
    process.exit(1);
  }
}

initializeDatabase();

module.exports = app;