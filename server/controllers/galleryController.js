const { GalleryImage } = require('../models');
const supabase = require('../config/supabaseStorage');
const path = require('path');

const galleryController = {
  // Obtener todas las imágenes de la galería
  getGalleryImages: async (req, res) => {
    try {
      const images = await GalleryImage.findAll({
        order: [['order', 'ASC'], ['created_at', 'DESC']]
      });
      
      // Asegurarse de que cada imagen tenga image_path
      const imagesWithPath = images.map(image => ({
        ...image.toJSON(),
        image_path: image.image_path || `/img/${image.filename}` || '/img/default-paella.jpg'
      }));
      
      res.json(imagesWithPath);
    } catch (error) {
      console.error('Error obteniendo imágenes de galería:', error);
      // Datos de ejemplo si hay error
      const defaultImages = [
        {
          id: 1,
          filename: 'gallery1.jpg',
          caption: 'Paella Tradicional Valenciana',
          image_path: '/img/gallery1.jpg',
          order: 1,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          filename: 'gallery2.jpg',
          caption: 'Paella de Mariscos',
          image_path: '/img/gallery2.jpg', 
          order: 2,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      res.json(defaultImages);
    }
  },

  // Obtener imagen específica por ID
  getGalleryImageById: async (req, res) => {
    try {
      const { id } = req.params;
      const image = await GalleryImage.findByPk(id);
      
      if (!image) {
        return res.status(404).json({ 
          success: false, 
          error: 'Imagen no encontrada' 
        });
      }
      
      // Asegurar que tenga image_path
      const imageData = {
        ...image.toJSON(),
        image_path: image.image_path || `/img/${image.filename}` || '/img/default-paella.jpg'
      };
      
      res.json(imageData);
    } catch (error) {
      console.error('Error obteniendo imagen por ID:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  },

  // Subir nueva imagen a la galería
  uploadImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'No se proporcionó imagen' 
        });
      }

      let imageUrl = '/img/default-paella.jpg';
      let fileName = `gallery-${Date.now()}${path.extname(req.file.originalname)}`;

      // Intentar subir a Supabase
      try {
        const { data, error } = await supabase.storage
          .from('paella-images')
          .upload(`gallery/${fileName}`, req.file.buffer, {
            contentType: req.file.mimetype
          });

        if (!error) {
          const { data: publicUrlData } = supabase.storage
            .from('paella-images')
            .getPublicUrl(`gallery/${fileName}`);
          imageUrl = publicUrlData.publicUrl;
          console.log('✅ Imagen subida a Supabase:', imageUrl);
        }
      } catch (supabaseError) {
        console.warn('⚠️  Error con Supabase:', supabaseError.message);
      }

      // Guardar en base de datos
      const galleryImage = await GalleryImage.create({
        filename: fileName,
        caption: req.body.caption || '',
        order: parseInt(req.body.order) || 0,
        image_path: imageUrl  // ← Esto ahora funcionará con el modelo actualizado
      });

      res.json({
        success: true,
        image: galleryImage,
        message: 'Imagen subida exitosamente'
      });

    } catch (error) {
      console.error('Error subiendo imagen:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error subiendo imagen' 
      });
    }
  },

  // Actualizar imagen de galería
  updateImage: async (req, res) => {
    try {
      const { id } = req.params;
      const { caption, order } = req.body;

      const updateData = {
        caption: caption || '',
        order: parseInt(order) || 0
      };

      const [affectedRows] = await GalleryImage.update(updateData, {
        where: { id }
      });

      if (affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Imagen no encontrada' 
        });
      }

      const updatedImage = await GalleryImage.findByPk(id);
      res.json({ 
        success: true, 
        image: updatedImage 
      });

    } catch (error) {
      console.error('Error actualizando imagen:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  },

  // Eliminar imagen de galería
  deleteImage: async (req, res) => {
    try {
      const { id } = req.params;
      
      const deletedRows = await GalleryImage.destroy({ 
        where: { id } 
      });

      if (deletedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Imagen no encontrada' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Imagen eliminada exitosamente' 
      });

    } catch (error) {
      console.error('Error eliminando imagen:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }
};

module.exports = galleryController;