const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlatformAccount = sequelize.define('PlatformAccount', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    platform: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    displayName: { // Nuevo campo para el nombre a mostrar
      type: DataTypes.STRING,
      allowNull: true, // Puede ser nulo si no se verifica o no se proporciona
    },
  }, {
    timestamps: true,
  });

  return PlatformAccount;
};
