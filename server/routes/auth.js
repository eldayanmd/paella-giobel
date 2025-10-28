const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { User, VerificationCode } = require('../models'); 
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

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
  console.log("Llegó a send-verification"); 
  try {
    const { email } = req.body;

    // Validación profesional del email
    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    // Generar código seguro de 6 dígitos
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos de validez

    // Guardar en base de datos
    await VerificationCode.create({
  email,
  code,
  expiresAt,
  attempts: 0
});

    // Plantilla de email profesional
    const mailOptions = {
      from: `"Paella Giobel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🟠 Tu Código de Verificación - Paella Giobel',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e67e22; border-radius: 8px;">
          <div style="background-color: #e67e22; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Verificación de Cuenta</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px;">Hola,</p>
            <p style="font-size: 16px;">Para completar tu registro, por favor utiliza el siguiente código de verificación:</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #e67e22; padding: 15px; margin: 20px 0;">
              <h2 style="color: #e67e22; margin: 0; text-align: center; letter-spacing: 3px;">${code}</h2>
            </div>
            
            <p style="font-size: 14px; color: #777;">Este código expirará en 15 minutos. Si no solicitaste este registro, por favor ignora este mensaje.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="font-size: 12px; color: #999;">© ${new Date().getFullYear()} Paella Giobel. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      `,
      text: `Tu código de verificación es: ${code}\n\nExpira en 15 minutos.`
    };

    // Envío robusto con manejo de errores
    await transporter.sendMail(mailOptions);
    
    return res.json({ 
      success: true,
      message: "Código enviado al correo electrónico"
    });
   } catch (error) {
    console.error('Error en send-verification:', error);
    return res.status(500).json({ 
      error: "Error al enviar el código de verificación",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    const { email, code, userData } = req.body;

    // Buscar el código en la base de datos
    const record = await VerificationCode.findOne({
      where: { email },
      order: [['createdAt', 'DESC']]
    });

    // Validaciones robustas
    if (!record) {
      return res.status(400).json({ error: "No se encontró solicitud de verificación" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ error: "El código ha expirado" });
    }

    if (record.attempts >= 3) {
      return res.status(400).json({ error: "Demasiados intentos fallidos" });
    }

    if (record.code !== code) {
      await record.increment('attempts');
      return res.status(400).json({ error: "Código incorrecto" });
    }

    // Registrar al usuario
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = await User.create({
      ...userData,
      password: hashedPassword,
      emailVerified: true
    });

    // Eliminar el código usado
    await record.destroy();

    // Generar token JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error('Error en verify-and-register:', error);
    res.status(500).json({ 
      error: "Error en el registro",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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


router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// En tu ruta de callback de Google
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login-error`
  }),
  (req, res) => {
    try {
      // Generar token JWT
      const token = jwt.sign(
        { 
          id: req.user.id,
          email: req.user.email,
          name: req.user.name 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Redirigir al frontend con el token EN LOS PARÁMETROS
      const redirectUrl = `${process.env.FRONTEND_URL}?token=${token}&user=${encodeURIComponent(req.user.name)}`;
      console.log('Redireccionando a:', redirectUrl);
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error('Error en callback de Google:', error);
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