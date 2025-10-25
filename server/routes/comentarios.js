const express = require('express');
const router = express.Router();
const { Comentario, User } = require('../models');
const { protect, authorize } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const comentarios = await Comentario.findAll({
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'picture'],
        required: false
      }],
      where: { aprobado: true },
      order: [['created_at', 'DESC']],
      raw: true,
      nest: true
    });
    
    const comentariosFormateados = comentarios.map(c => ({
      id: c.id,
      user_id: c.usuario?.id || null,
      nombre_usuario: c.usuario?.nombre || c.nombre_usuario,
      imagen_usuario: c.usuario?.picture || c.imagen_usuario,
      estrellas: c.estrellas,
      comentario: c.comentario,
      created_at: c.created_at,
      aprobado: c.aprobado
    }));
    
    res.json({ 
      success: true, 
      comentarios: comentariosFormateados 
    });
  } catch (error) {
    console.error('Error en GET /api/comentarios:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener comentarios'
    });
  }
});

router.post('/', protect, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                success: false,
                error: 'Usuario no autenticado' 
            });
        }

        const { estrellas, comentario } = req.body;
        
        const errors = [];
        if (!estrellas || estrellas < 1 || estrellas > 5) {
            errors.push('La calificación debe ser entre 1 y 5 estrellas');
        }
        if (!comentario || comentario.trim().length < 10) {
            errors.push('El comentario debe tener al menos 10 caracteres');
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                errors: errors
            });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const nuevoComentario = await Comentario.create({
            user_id: user.id,
            nombre_usuario: user.nombre,
            imagen_usuario: user.picture,
            estrellas: parseInt(estrellas),
            comentario: comentario.trim(),
            aprobado: false,
            created_at: new Date()
        });

        return res.status(201).json({
            success: true,
            comentario: {
                id: nuevoComentario.id,
                estrellas: nuevoComentario.estrellas,
                comentario: nuevoComentario.comentario,
                created_at: nuevoComentario.created_at
            },
            message: '¡Gracias por tu comentario! Será visible después de aprobación.'
        });

    } catch (error) {
        console.error('Error en POST /api/comentarios:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al guardar comentario'
        });
    }
});

router.get('/pendientes', protect, authorize(['admin']), async (req, res) => {
  try {
    const comentarios = await Comentario.findAll({
      where: { aprobado: false },
      include: [{ 
        model: User, 
        as: 'usuario',
        attributes: ['id', 'nombre', 'picture'] 
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, comentarios });
  } catch (error) {
    console.error('Error en GET /pendientes:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

router.post('/:id/aprobar', protect, authorize(['admin']), async (req, res) => {
  try {
    const comentario = await Comentario.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'picture'],
        required: false
      }]
    });

    if (!comentario) {
      return res.status(404).json({ 
        success: false,
        error: 'Comentario no encontrado' 
      });
    }

    await comentario.update({ aprobado: true });

    // Obtener comentarios pendientes actualizados
    const pendientes = await Comentario.findAll({
      where: { aprobado: false },
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'picture'],
        required: false
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ 
      success: true,
      comentario: {
        id: comentario.id,
        user_id: comentario.usuario?.id || null,
        nombre_usuario: comentario.usuario?.nombre || comentario.nombre_usuario,
        imagen_usuario: comentario.usuario?.picture || comentario.imagen_usuario,
        estrellas: comentario.estrellas,
        comentario: comentario.comentario,
        created_at: comentario.created_at
      },
      pendientes: pendientes.map(c => ({
        id: c.id,
        user_id: c.usuario?.id || null,
        nombre_usuario: c.usuario?.nombre || c.nombre_usuario,
        imagen_usuario: c.usuario?.picture || c.imagen_usuario,
        estrellas: c.estrellas,
        comentario: c.comentario,
        created_at: c.created_at
      }))
    });

  } catch (error) {
    console.error('Error al aprobar comentario:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error del servidor' 
    });
  }
});

router.delete('/:id', protect, authorize(['admin']), async (req, res) => {
  try {
    await Comentario.destroy({ where: { id: req.params.id } });
    
    // Devuelve la lista actualizada de comentarios pendientes
    const pendientes = await Comentario.count({
      where: { aprobado: false }
    });

    res.json({ 
      success: true,
      pendientes: pendientes
    });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/todos', protect, authorize(['admin']), async (req, res) => {
  try {
    const comentarios = await Comentario.findAll({
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'picture'],
        required: false
      }],
      order: [['created_at', 'DESC']],
      raw: true,
      nest: true
    });
    
    const comentariosFormateados = comentarios.map(c => ({
      id: c.id,
      user_id: c.usuario?.id || null,
      nombre_usuario: c.usuario?.nombre || c.nombre_usuario,
      imagen_usuario: c.usuario?.picture || c.imagen_usuario,
      estrellas: c.estrellas,
      comentario: c.comentario,
      created_at: c.created_at,
      aprobado: c.aprobado
    }));
    
    res.json({ 
      success: true, 
      comentarios: comentariosFormateados 
    });
  } catch (error) {
    console.error('Error en GET /api/comentarios/todos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener todos los comentarios'
    });
  }
});

module.exports = router;
