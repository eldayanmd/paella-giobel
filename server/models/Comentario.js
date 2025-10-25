'use strict';
module.exports = (sequelize, DataTypes) => {
  const Comentario = sequelize.define('Comentario', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    nombre_usuario: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    imagen_usuario: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    estrellas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    aprobado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'comentarios',
    underscored: true,
    timestamps: true, // Habilitar timestamps
    createdAt: 'created_at', // Mapear a la columna correcta
    updatedAt: false // No usar updatedAt
  });

  Comentario.associate = function(models) {
    Comentario.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'usuario'
    });
  };

  return Comentario;
};