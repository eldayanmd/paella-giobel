const { Comentario, User } = require('../models');

exports.crearComentario = async (req, res) => {
  try {
    const { estrellas, comentario } = req.body;
    const user = await User.findByPk(req.user.id);
    
    const nuevoComentario = await Comentario.create({
      user_id: user.id,
      nombre_usuario: user.nombre,
      imagen_usuario: user.picture,
      estrellas,
      comentario,
      aprobado: false // Opcional: moderación antes de publicar
    });

    res.status(201).json({
      success: true,
      comentario: nuevoComentario
    });
  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al guardar el comentario' 
    });
  }
};

exports.obtenerComentarios = async (req, res) => {
  try {
    const comentarios = await Comentario.findAll({
      where: { aprobado: true },
      order: [['fecha_creacion', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      comentarios
    });
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener comentarios' 
    });
  }
};
exports.aprobarComentario = async (req, res) => {
  try {
    const comentario = await Comentario.findByPk(req.params.id);
    
    if (!comentario) {
      return res.status(404).json({ 
        success: false,
        error: 'Comentario no encontrado' 
      });
    }

    await comentario.update({ aprobado: true });

    // Obtener el comentario actualizado con información del usuario si existe
    const comentarioAprobado = await Comentario.findByPk(comentario.id, {
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'picture'],
        required: false
      }]
    });

    res.json({
      success: true,
      comentario: {
        id: comentarioAprobado.id,
        user_id: comentarioAprobado.usuario?.id || null,
        nombre_usuario: comentarioAprobado.usuario?.nombre || comentarioAprobado.nombre_usuario,
        imagen_usuario: comentarioAprobado.usuario?.picture || comentarioAprobado.imagen_usuario,
        estrellas: comentarioAprobado.estrellas,
        comentario: comentarioAprobado.comentario,
        created_at: comentarioAprobado.created_at,
        aprobado: comentarioAprobado.aprobado
      }
    });

  } catch (error) {
    console.error('Error al aprobar comentario:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al aprobar comentario' 
    });
  }
};