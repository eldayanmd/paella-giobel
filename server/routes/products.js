const express = require('express');
const router = express.Router();
const { Product, sequelize, Sequelize } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const productController = require('../controllers/productController');

// Configuración mejorada de Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
});

// Obtener todos los productos (acceso público)
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: [
        'id',
        'nombre',
        'descripcion',
        'imagen',
        [sequelize.cast(sequelize.col('precio'), 'FLOAT'), 'precio'], // Aquí se usa sequelize
        'tipo',
        'destacado'
      ],
      order: [['destacado', 'DESC'], ['created_at', 'DESC']]
    });
    
    res.json({ 
      success: true, 
      products: products.map(p => p.get({ plain: true })) 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al cargar productos',
      details: error.message 
    });
  }
});

// Obtener un producto por ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
});

router.post('/', protect, authorize(['admin']), upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, descripcion, precio, tipo } = req.body;
    
    // CAMBIAR ESTO:
    // const imageFile = req.files ? req.files.find(file => file.mimetype.startsWith('image/')) : null;
    
    // POR ESTO:
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ success: false, error: 'Imagen requerida' });
    }

    const newProduct = await Product.create({
      nombre,
      descripcion,
      imagen: imageFile.filename, // Ya no necesitas replace
      precio: parseFloat(precio),
      tipo
    });

    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al crear producto',
      details: error.message 
    });
  }
});
// Actualizar producto (solo admin)
router.put('/:id', protect, authorize(['admin']), upload.single('imagen'), async (req, res) => {

  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    const { nombre, descripcion, precio, tipo } = req.body;
    
    // Buscar el archivo de imagen entre todos los archivos subidos
    const imageFile = req.file;


    // Actualizar imagen solo si se subió una nueva
    if (imageFile) {
      product.imagen = imageFile.filename; // Guardar solo el nombre del archivo
    }

    product.nombre = nombre || product.nombre;
    product.descripcion = descripcion || product.descripcion;
    product.precio = parseFloat(precio) || product.precio; // Asegurar que el precio es un float
    product.tipo = tipo || product.tipo;

    await product.save();

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
});

// Eliminar producto (solo admin)
router.delete('/:id', protect, authorize(['admin']), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    await product.destroy();
    res.json({ success: true, message: 'Producto eliminado' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
});

module.exports = router;
