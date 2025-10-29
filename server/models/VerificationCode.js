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
      field: 'expires_at' // ← AGREGA ESTO para mapear a snake_case
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
    tableName: 'verification_codes', // ← Asegúrate de tener esto
    indexes: [
      {
        fields: ['expires_at'] // ← Usa snake_case aquí también
      },
      {
        fields: ['email']
      }
    ],
    timestamps: true,
    underscored: true // ← AGREGA ESTO para usar snake_case automáticamente
  });

  return VerificationCode;
};