const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { protect } = require('../middleware/auth');

// Obtener información del usuario actual
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'nombre', 'email', 'telefono', 'createdAt']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
