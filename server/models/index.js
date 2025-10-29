'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Cargar todos los modelos
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Importar el modelo de Comentario manualmente si no se carga automáticamente
const Comentario = require('./Comentario')(sequelize, Sequelize.DataTypes);
db[Comentario.name] = Comentario;

// Importar el modelo de GalleryImage manualmente
const GalleryImage = require('./GalleryImage')(sequelize, Sequelize.DataTypes);
db[GalleryImage.name] = GalleryImage;

// Importar el modelo de PlatformAccount manualmente
const PlatformAccount = require('./PlatformAccount')(sequelize, Sequelize.DataTypes);
db[PlatformAccount.name] = PlatformAccount;

const VerificationCode = require('./VerificationCode')(sequelize, Sequelize.DataTypes);
db[VerificationCode.name] = VerificationCode;

// Establecer asociaciones
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
