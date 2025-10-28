const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { User, VerificationCode } = require('../models'); 
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();
const verificationCodes = new Map();

console.log('User model imported correctly?', User !== undefined);

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  pool: true,
  maxConnections: 1, // Reduce el número de conexiones simultáneas
  secure: true, // Usa TLS
  tls: {
    rejectUnauthorized: false // Solo para desarrollo, quitar en producción
  }
});


router.post('/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('📧 Iniciando envío de código a:', email);
    console.log('🔑 EMAIL_USER:', process.env.EMAIL_USER ? 'PRESENTE' : 'AUSENTE');
    console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? 'PRESENTE' : 'AUSENTE');

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔢 Código generado:', code);
    
    // Guardar código por 10 minutos
    verificationCodes.set(email, {
      code,
      expires: Date.now() + 10 * 60 * 1000
    });

    console.log('🚀 Configurando transporter de Nodemailer...');
    
    // Configurar Nodemailer con timeout más corto para debug
    const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

    console.log('✅ Transporter configurado, verificando conexión...');
    
    // Verificar conexión primero
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada');

    console.log('📤 Enviando email...');
    
    // Enviar email
    const info = await transporter.sendMail({
      from: '"Paella Giobel" <paellagiobel@gmail.com>',
      to: email,
      subject: '🔐 Código de Verificación - Paella Giobel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #a0522d;">Paella Giobel</h2>
          <p>Tu código de verificación es:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #a0522d; letter-spacing: 5px;">
            ${code}
          </div>
          <p>Este código expira en 10 minutos.</p>
        </div>
      `
    });

    console.log('✅ Email enviado exitosamente:', info.messageId);

    res.json({ 
      success: true, 
      message: 'Código enviado a tu email' 
    });

  } catch (error) {
    console.error('❌ Error enviando código:', error);
    console.error('❌ Detalles del error:', {
      code: error.code,
      command: error.command,
      message: error.message
    });
    
    res.status(500).json({ 
      success: false, 
      error: 'Error enviando código de verificación',
      details: error.message 
    });
  }
});
// Ruta temporal para probar email
router.get('/test-email', async (req, res) => {
  try {
    console.log('🧪 Probando configuración de email...');
    
    const testTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      connectionTimeout: 10000
    });

    console.log('✅ Transporter creado, verificando...');
    await testTransporter.verify();
    console.log('✅ Conexión SMTP funcionando');
    
    res.json({ 
      success: true, 
      message: 'Email configurado correctamente' 
    });
  } catch (error) {
    console.error('❌ Error SMTP:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
// Endpoint para verificar código
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    // Buscar el código en la base de datos
    const record = await VerificationCode.findOne({
      where: { email },
      order: [['createdAt', 'DESC']]
    });

    // Validaciones
    if (!record) {
      return res.status(400).json({ 
        success: false,
        error: "No se encontró solicitud de verificación" 
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ 
        success: false,
        error: "El código ha expirado" 
      });
    }

    if (record.attempts >= 3) {
      return res.status(400).json({ 
        success: false,
        error: "Demasiados intentos fallidos" 
      });
    }

    if (record.code !== code) {
      await record.increment('attempts');
      return res.status(400).json({ 
        success: false,
        error: "Código incorrecto" 
      });
    }

    // Si el código es correcto
    await record.destroy(); // Eliminar el código usado

    res.json({ 
      success: true,
      message: "Código verificado correctamente" 
    });

  } catch (error) {
    console.error('Error en verify-code:', error);
    res.status(500).json({ 
      success: false,
      error: "Error al verificar el código",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Endpoint para verificar código
router.post('/verify-and-register', async (req, res) => {
  try {
    const { nombre, email, password, code } = req.body;

    // Verificar código
    const storedCode = verificationCodes.get(email);
    
    if (!storedCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'Código no encontrado o expirado' 
      });
    }

    if (Date.now() > storedCode.expires) {
      verificationCodes.delete(email);
      return res.status(400).json({ 
        success: false, 
        error: 'Código expirado' 
      });
    }

    if (storedCode.code !== code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Código incorrecto' 
      });
    }

    // Código correcto - Crear usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      nombre,
      email,
      password: hashedPassword,
      auth_method: 'email',
      profile_complete: true,
      email_verified: true
    });

    // Limpiar código usado
    verificationCodes.delete(email);

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        nombre: user.nombre
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Registro completado exitosamente',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error completando registro' 
    });
  }
});

router.post('/register', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Todos los campos son requeridos' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                error: 'El email ya está registrado' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            nombre,
            email,
            password: hashedPassword
        });

        const token = jwt.sign(
            { 
                id: newUser.id,
                email: newUser.email,
                nombre: newUser.nombre
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser.id,
                nombre: newUser.nombre,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Error en el servidor' 
        });
    }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email y contraseña son requeridos' 
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Credenciales inválidas' 
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Credenciales inválidas' 
      });
    }

    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        picture: user.picture
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      success: true,
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error en el servidor' 
    });
  }
});


router.get('/google', (req, res, next) => {
    console.log('🚀 Iniciando autenticación Google...');
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })(req, res, next);
});

// En tu ruta de callback de Google
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login-error`
  }),
  (req, res) => {
    try {
      // Generar token JWT más corto
      const tokenPayload = {
        id: req.user.id,
        email: req.user.email,
        nombre: req.user.nombre
      };
      
      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });
      const userName = req.user.nombre || 'Usuario';
      
      // Usar fragment identifier en lugar de query parameters
      const redirectUrl = `${process.env.FRONTEND_URL}#token=${token}&user=${encodeURIComponent(userName)}`;
      
      console.log('🔄 Redireccionando con fragment:', redirectUrl);
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error('❌ Error en callback de Google:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login-error`);
    }
  }
);


router.post('/complete-profile', async (req, res) => {
    try {
        const { token, password } = req.body;
        
        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'Usuario no encontrado' 
            });
        }

        // Actualizar usuario
        const hashedPassword = await bcrypt.hash(password, 10);
        await user.update({
            password: hashedPassword,
            profile_complete: true
        });

        // Obtener el usuario actualizado
        const updatedUser = await User.findByPk(decoded.id);

        // Generar nuevo token
        const newToken = jwt.sign(
            {
                id: updatedUser.id,
                email: updatedUser.email,
                nombre: updatedUser.nombre,
                picture: updatedUser.picture,
                profileComplete: true,
                authMethod: 'google'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Enviar respuesta completa
        res.json({
            success: true,
            token: newToken,
            user: {
                id: updatedUser.id,
                nombre: updatedUser.nombre,
                email: updatedUser.email,
                picture: updatedUser.picture,
                authMethod: 'google'
            }
        });

    } catch (error) {
        console.error('Error en completeProfile:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor' 
        });
    }
});

router.get('/me', 
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        try {
            const user = await User.findByPk(req.user.id, {
                attributes: ['id', 'nombre', 'email', 'telefono', 'createdAt']
            });

            if (!user) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Usuario no encontrado' 
                });
            }

            res.json({ 
                success: true,
                user 
            });

        } catch (error) {
            console.error('Error al obtener usuario:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error en el servidor' 
            });
        }
    }
);

module.exports = router;