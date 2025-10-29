// VerificationCode.js
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
      allowNull: false,
      field: 'expires_at'
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    },
    userData: {
      type: DataTypes.TEXT, // ← NUEVO CAMPO para guardar datos del usuario
      allowNull: true
    }
  }, {
    tableName: 'verification_codes',
    timestamps: true,
    underscored: true
  });

  return VerificationCode;
};