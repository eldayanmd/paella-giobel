// models/Product.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    imagen: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('tradicional', 'vegetariana', 'mariscos', 'carne'),
      allowNull: false
    }
  }, {
    tableName: 'products',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Product;
};