const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GalleryImage = sequelize.define('GalleryImage', {
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    caption: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'gallery_images',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return GalleryImage;
};
