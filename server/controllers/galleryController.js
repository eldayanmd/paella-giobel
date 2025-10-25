const supabase = require('../config/supabaseStorage');
const { GalleryImage, sequelize } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de Multer para imágenes de galería
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../client/img/gallery');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `gallery-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Obtener todas las imágenes de la galería
exports.getAllGalleryImages = async (req, res) => {
  try {
    const images = await GalleryImage.findAll({
      order: [['order', 'ASC'], ['created_at', 'DESC']]
    });
    res.json({ success: true, images });
  } catch (error) {
    console.error('Error al obtener imágenes de la galería:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};

// Obtener una imagen de la galería por ID
exports.getGalleryImageById = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await GalleryImage.findByPk(id);

    if (!image) {
      return res.status(404).json({ success: false, error: 'Imagen no encontrada' });
    }

    res.json({ success: true, image });
  } catch (error) {
    console.error('Error al obtener imagen de galería por ID:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};

// Subir una nueva imagen a la galería
exports.uploadGalleryImage = async (req, res) => {
  try {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        console.error('Error de Multer al subir imagen:', err);
        return res.status(400).json({ success: false, error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No se proporcionó ninguna imagen' });
      }

      const { caption, order } = req.body;

      const newImage = await GalleryImage.create({
        filename: req.file.filename,
        caption: caption || null,
        order: order ? parseInt(order) : 0
      });

      res.status(201).json({ success: true, image: newImage });
    });
  } catch (error) {
    console.error('Error al subir imagen de galería:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};

// Actualizar una imagen de la galería (ej. cambiar caption, orden o el archivo de imagen)
exports.updateGalleryImage = async (req, res) => {
  try {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        console.error('Error de Multer al actualizar imagen:', err);
        return res.status(400).json({ success: false, error: err.message });
      }

      const { id } = req.params;
      const { caption, order } = req.body;

      const image = await GalleryImage.findByPk(id);
      if (!image) {
        // Si no se encuentra la imagen, eliminar el archivo recién subido si existe
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ success: false, error: 'Imagen no encontrada' });
      }

      // Si se subió un nuevo archivo de imagen
      if (req.file) {
        // Eliminar el archivo de imagen antiguo
        const oldImagePath = path.join(__dirname, '../../client/img/gallery', image.filename);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        image.filename = req.file.filename;
      }

      image.caption = caption !== undefined ? caption : image.caption;
      image.order = order !== undefined ? parseInt(order) : image.order;

      await image.save();
      res.json({ success: true, image });
    });
  } catch (error) {
    console.error('Error al actualizar imagen de galería:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};

// Eliminar una imagen de la galería
exports.deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await GalleryImage.findByPk(id);
    if (!image) {
      return res.status(404).json({ success: false, error: 'Imagen no encontrada' });
    }

    // Eliminar el archivo físico
    const imagePath = path.join(__dirname, '../../client/img/gallery', image.filename);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await image.destroy();
    res.json({ success: true, message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar imagen de galería:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó imagen' });
    }

    // Generar nombre único
    const timestamp = Date.now();
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `gallery-${timestamp}${fileExtension}`;

    // Subir a Supabase
    const { data, error } = await supabase.storage
      .from('paella-images')
      .upload(`gallery/${fileName}`, req.file.buffer, {
        contentType: req.file.mimetype
      });

    if (error) throw error;

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('paella-images')
      .getPublicUrl(`gallery/${fileName}`);

    // Guardar en base de datos
    const galleryImage = await GalleryImage.create({
      filename: fileName,
      caption: req.body.caption || '',
      order: parseInt(req.body.order) || 0
    });

    res.json({
      success: true,
      image: {
        id: galleryImage.id,
        filename: fileName,
        caption: galleryImage.caption,
        url: publicUrlData.publicUrl
      }
    });

  } catch (error) {
    console.error('Error subiendo imagen:', error);
    res.status(500).json({ error: 'Error subiendo imagen' });
  }
};

};
