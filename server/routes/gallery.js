const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { protect, authorize } = require('../middleware/auth');

// Rutas públicas para obtener imágenes de la galería
router.get('/', galleryController.getAllGalleryImages);
router.get('/:id', galleryController.getGalleryImageById); // Nueva ruta para obtener una imagen por ID

// Rutas protegidas para administración de galería (solo admin)
router.post('/', protect, authorize(['admin']), galleryController.uploadGalleryImage);
router.put('/:id', protect, authorize(['admin']), galleryController.updateGalleryImage);
router.delete('/:id', protect, authorize(['admin']), galleryController.deleteGalleryImage);

module.exports = router;
