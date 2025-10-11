const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');

// Obtener todas las categorías
router.get('/', CategoryController.getAllCategories);

// Obtener categoría por ID
router.get('/:id', CategoryController.getCategoryById);

// Crear nueva categoría (opcional)
router.post('/', CategoryController.createCategory);

module.exports = router;