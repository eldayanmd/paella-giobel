'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // Asociaciones si las necesitas
    }
    
  }

  User.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: DataTypes.STRING,
    google_id: DataTypes.STRING,
    picture: DataTypes.STRING,
    auth_method: {
      type: DataTypes.STRING,
      defaultValue: 'local'
    },
    profile_complete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true
  });

  return User;
};