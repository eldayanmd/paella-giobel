const supabase = require('../config/supabaseStorage');
const { Product } = require('../models');
const path = require('path');

const createProduct = async (req, res) => {
  try {
    let imageUrl = '/img/default-paella.jpg';
    
    if (req.file) {
      // Generar nombre único para la imagen
      const timestamp = Date.now();
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `product-${timestamp}${fileExtension}`;
      
      // Subir imagen a Supabase Storage
      const { data, error } = await supabase.storage
        .from('paella-images')
        .upload(`products/${fileName}`, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error subiendo imagen:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Error subiendo imagen' 
        });
      }

      // Obtener URL pública de la imagen
      const { data: publicUrlData } = supabase.storage
        .from('paella-images')
        .getPublicUrl(`products/${fileName}`);
      
      imageUrl = publicUrlData.publicUrl;
    }

    // Crear producto en la base de datos
    const product = await Product.create({
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      imagen: imageUrl,
      precio: parseFloat(req.body.precio),
      tipo: req.body.tipo,
      destacado: req.body.destacado === 'true'
    });

    res.json({ 
      success: true, 
      product,
      message: 'Producto creado exitosamente' 
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    if (req.file) {
      // Subir nueva imagen
      const timestamp = Date.now();
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `product-${timestamp}${fileExtension}`;
      
      const { data, error } = await supabase.storage
        .from('paella-images')
        .upload(`products/${fileName}`, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('paella-images')
        .getPublicUrl(`products/${fileName}`);
      
      updateData.imagen = publicUrlData.publicUrl;
    }

    const product = await Product.update(updateData, {
      where: { id },
      returning: true
    });

    res.json({ success: true, product });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
};

module.exports = {
  createProduct,
  updateProduct
};