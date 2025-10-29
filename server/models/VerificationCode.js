// VerificationCode.js - QUITA el índice único
module.exports = (sequelize, DataTypes) => {
  const VerificationCode = sequelize.define('VerificationCode', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    }
  }, {
    indexes: [
      // ELIMINA este índice único ↓
      // {
      //   unique: true,
      //   fields: ['email']
      // },
      {
        fields: ['expiresAt']
      },
      {
        fields: ['email'] // Agrega este índice normal (no único)
      }
    ],
    timestamps: true
  });

  return VerificationCode;
};