const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const multer = require('multer');

// Configurar multer para memoria (para Supabase)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB límite
});

// ==================== RUTAS PÚBLICAS ====================
// Obtener todas las imágenes de la galería
router.get('/', galleryController.getGalleryImages);

// Obtener imagen específica por ID
router.get('/:id', galleryController.getGalleryImageById);

// ==================== RUTAS DE ADMINISTRACIÓN ====================
// Subir nueva imagen (sin autenticación por ahora)
router.post('/', upload.single('imagen'), galleryController.uploadImage);

// Actualizar información de imagen (sin autenticación por ahora)
router.put('/:id', galleryController.updateImage);

// Eliminar imagen (sin autenticación por ahora) 
router.delete('/:id', galleryController.deleteImage);

module.exports = router;