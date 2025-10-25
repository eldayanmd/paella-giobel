const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Asegúrate de que User se importa correctamente desde index.js o User.js

// Middleware para proteger rutas (autenticación)
const protect = (req, res, next) => {
  try {
    // 1. Obtener token de diferentes lugares
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                 req.cookies?.token || 
                 req.query?.token;

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Acceso no autorizado. Token requerido.' 
      });
    }

    // 2. Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'Eraisy2266.');
    
    // 3. Adjuntar usuario a la request
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Error en autenticación:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Sesión expirada. Por favor vuelve a iniciar sesión.' 
      });
    }

    res.status(401).json({ 
      success: false,
      error: 'Acceso no autorizado. Token inválido.' 
    });
  }
};

// Middleware para autorizar roles
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // Asumiendo que req.user.email contiene el email del usuario autenticado
    // y que el admin tiene un email específico (paellagiobel@gmail.com)
    const isAdmin = req.user && req.user.email === 'paellagiobel@gmail.com';

    if (roles.length > 0 && !roles.includes('admin')) {
      return res.status(403).json({ 
        success: false,
        error: 'Acceso denegado. No tienes los permisos necesarios.' 
      });
    }

    // Si el rol requerido es 'admin' y el usuario no es admin
    if (roles.includes('admin') && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Acceso denegado. Se requiere rol de administrador.' 
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
