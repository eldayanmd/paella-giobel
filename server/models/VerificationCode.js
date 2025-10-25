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
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['expiresAt']
      }
    ],
    timestamps: true
  });

  return VerificationCode;
};