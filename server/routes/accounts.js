const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { protect, authorize } = require('../middleware/auth'); // Asumiendo que tienes un middleware de autenticación

// Rutas protegidas para administradores
router.route('/')
  .get(accountController.getAllAccounts) // Hacer esta ruta pública
  .post(protect, authorize(['admin']), accountController.createAccount);

router.route('/:id')
  .get(protect, authorize(['admin']), accountController.getAccountById)
  .put(protect, authorize(['admin']), accountController.updateAccount)
  .delete(protect, authorize(['admin']), accountController.deleteAccount);

// Ruta para la verificación simulada de cuentas
router.post('/verify', protect, authorize(['admin']), accountController.verifyAccount);

module.exports = router;
