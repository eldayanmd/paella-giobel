const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { User, VerificationCode } = require('../models'); 
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
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

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔢 Código generado:', code);
    
    // Calcular expiración (10 minutos)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Guardar en base de datos (puede haber múltiples para el mismo email)
    await VerificationCode.create({
      email,
      code,
      expiresAt
    });

    console.log('💾 Código guardado en base de datos para:', email);


    // Enviar email con Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🔐 Código de Verificación - Paella Giobel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #a0522d; margin: 0;">🍲 Paella Giobel</h2>
          </div>
          
          <div style="background: #f8f8f8; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0 0 15px 0; font-size: 16px;">Tu código de verificación es:</p>
            <div style="background: #ffffff; padding: 25px; text-align: center; font-size: 36px; font-weight: bold; color: #a0522d; letter-spacing: 8px; border: 2px dashed #a0522d; border-radius: 8px;">
              ${code}
            </div>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Este código expira en <strong>10 minutos</strong>.</p>
            <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
          </div>
        </div>
      `
    });

    if (error) throw error;

    console.log('✅ Email enviado exitosamente');
    
    // Limpiar códigos expirados
    await VerificationCode.destroy({
      where: {
        expires_at: {
          [Op.lt]: new Date()
        }
      }
    });

    res.json({ 
      success: true, 
      message: 'Código enviado a tu email' 
    });

  } catch (error) {
    console.error('❌ Error enviando código:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error enviando código de verificación'
    });
  }
});


// Ruta temporal para probar email
router.get('/test-email', async (req, res) => {
  try {
    console.log('🧪 Probando Resend...');
    
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: 'marrerodayan82@gmail.com',
      subject: '✅ Test Email - Paella Giobel',
      html: '<p>Este es un email de prueba desde Resend!</p>'
    });

    if (error) {
      console.error('❌ Error de Resend:', error);
      throw error;
    }

    console.log('✅ Test email enviado:', data.id);
    res.json({ success: true, message: 'Email de prueba enviado', emailId: data.id });
    
  } catch (error) {
    console.error('❌ Error en test:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Endpoint para verificar código
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    console.log('🔍 Verificando código:', { email, code });

    // Buscar el código en la base de datos
    const record = await VerificationCode.findOne({
      where: { email },
      order: [['createdAt', 'DESC']]
    });

    console.log('📋 Registro encontrado:', record ? {
      id: record.id,
      code: record.code,
      expiresAt: record.expiresAt,
      attempts: record.attempts,
      createdAt: record.createdAt
    } : 'NO ENCONTRADO');

    // Validaciones
    if (!record) {
      console.log('❌ No se encontró solicitud de verificación');
      return res.status(400).json({ 
        success: false,
        error: "No se encontró solicitud de verificación" 
      });
    }

    if (record.expiresAt < new Date()) {
      console.log('❌ Código expirado:', record.expiresAt);
      return res.status(400).json({ 
        success: false,
        error: "El código ha expirado" 
      });
    }

    if (record.attempts >= 3) {
      console.log('❌ Demasiados intentos:', record.attempts);
      return res.status(400).json({ 
        success: false,
        error: "Demasiados intentos fallidos" 
      });
    }

    if (record.code !== code) {
      console.log('❌ Código incorrecto. Esperado:', record.code, 'Recibido:', code);
      await record.increment('attempts');
      return res.status(400).json({ 
        success: false,
        error: "Código incorrecto" 
      });
    }

    // Si el código es correcto
    console.log('✅ Código verificado correctamente');
    await record.destroy();

    res.json({ 
      success: true,
      message: "Código verificado correctamente" 
    });

  } catch (error) {
    console.error('❌ Error en verify-code:', error);
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