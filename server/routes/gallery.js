const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const db = require('../models');

// Configurar Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Configurar multer para memoria
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Usar el modelo correcto
const GalleryImage = db.GalleryImage;

// ==================== RUTAS PÚBLICAS ====================

// Obtener todas las imágenes de la galería
router.get('/', async (req, res) => {
  try {
    const images = await GalleryImage.findAll({
      order: [['orden', 'ASC'], ['created_at', 'DESC']]
    });
    
    res.json({ 
      success: true, 
      images: images.map(img => img.get({ plain: true })) 
    });
  } catch (error) {
    console.error('Error al obtener galería:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al cargar galería',
      details: error.message
    });
  }
});

// Obtener imagen específica por ID
router.get('/:id', async (req, res) => {
  try {
    const image = await GalleryImage.findByPk(req.params.id);
    if (!image) {
      return res.status(404).json({ 
        success: false, 
        error: 'Imagen no encontrada' 
      });
    }
    
    res.json({ success: true, image });
  } catch (error) {
    console.error('Error al obtener imagen:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error en el servidor' 
    });
  }
});

// ==================== RUTAS DE ADMINISTRACIÓN ====================

// Subir nueva imagen
router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    const { caption, order } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ 
        success: false, 
        error: 'Imagen requerida' 
      });
    }

    // 1. Subir imagen a Supabase Storage
    const fileExtension = path.extname(imageFile.originalname);
    const fileName = `gallery/gallery-${Date.now()}${fileExtension}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, imageFile.buffer, {
        contentType: imageFile.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Error subiendo a Supabase:', uploadError);
      return res.status(500).json({ 
        success: false, 
        error: 'Error subiendo imagen al almacenamiento' 
      });
    }

    // 2. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    // 3. Guardar en base de datos
    const newImage = await GalleryImage.create({
      imagen: publicUrl,
      caption: caption || '',
      orden: parseInt(order) || 0,
      filename: fileName
    });

    res.status(201).json({ 
      success: true, 
      image: newImage,
      message: 'Imagen agregada exitosamente'
    });

  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Actualizar información de imagen
router.put('/:id', async (req, res) => {
  try {
    const { caption, order } = req.body;
    const imageId = req.params.id;

    const image = await GalleryImage.findByPk(imageId);
    if (!image) {
      return res.status(404).json({ 
        success: false, 
        error: 'Imagen no encontrada' 
      });
    }

    // Actualizar campos
    if (caption !== undefined) image.caption = caption;
    if (order !== undefined) image.orden = parseInt(order);

    await image.save();

    res.json({ 
      success: true, 
      image,
      message: 'Imagen actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar imagen:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al actualizar imagen' 
    });
  }
});

// Eliminar imagen
router.delete('/:id', async (req, res) => {
  try {
    const imageId = req.params.id;

    const image = await GalleryImage.findByPk(imageId);
    if (!image) {
      return res.status(404).json({ 
        success: false, 
        error: 'Imagen no encontrada' 
      });
    }

    // 1. Eliminar archivo de Supabase Storage si existe filename
    if (image.filename) {
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove([image.filename]);

      if (storageError) {
        console.error('Error eliminando de Supabase:', storageError);
        // Continuamos aunque falle la eliminación del archivo
      }
    }

    // 2. Eliminar registro de la base de datos
    await image.destroy();

    res.json({ 
      success: true, 
      message: 'Imagen eliminada exitosamente' 
    });

  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al eliminar imagen' 
    });
  }
});

module.exports = router;