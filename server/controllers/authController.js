
const db = require('../models');
const User = db.User || db.user || db.users; // Prueba diferentes variaciones

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validación de campos
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email y contraseña son requeridos' 
      });
    }

    // 2. Acceso especial para admin
    if (email.trim() === 'paellagiobel@gmail.com' && password === '123456') {
      const adminUser = {
        id: 999, // ID especial para admin
        nombre: 'Paella Giobel',
        email: 'paellagiobel@gmail.com',
        isAdmin: true,
        picture: null
      };

      const token = jwt.sign(
        adminUser,
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        success: true,
        token,
        user: adminUser,
        message: 'Bienvenido Administrador'
      });
    }

    // 3. Buscar usuario normal
    const user = await User.findOne({ where: { email: email.trim() } });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // 4. Verificar contraseña
    let validPassword = false;
    
    if (user.auth_method === 'google' && !user.password) {
      return res.status(401).json({
        success: false,
        error: 'Este email está registrado con Google. Por favor inicia sesión con Google.'
      });
    }

    if (user.auth_method === 'local') {
      validPassword = await bcrypt.compare(password, user.password);
    }

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // 5. Generar token para usuario normal
    const userPayload = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      picture: user.picture,
      isAdmin: false
    };

    const token = jwt.sign(
      userPayload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 6. Respuesta exitosa
    res.json({
      success: true,
      token,
      user: userPayload,
      message: `Bienvenido ${user.nombre}`
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
exports.completeProfile = async (req, res) => {
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
                authMethod: 'google',
                profileComplete: true
            }
        });

    } catch (error) {
        console.error('Error en completeProfile:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor' 
        });
    }
};