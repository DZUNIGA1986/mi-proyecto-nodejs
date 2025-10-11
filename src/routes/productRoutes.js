/**
 * Rutas de Producto
 * Responsabilidades: Definir endpoints para productos
 */

const express = require('express');
const ProductController = require('../controllers/ProductController');
const { verifyToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ===========================================
// RUTAS PÚBLICAS (lectura sin autenticación)
// ===========================================

/**
 * @route   GET /api/products
 * @desc    Obtener todos los productos con filtros
 * @access  Público
 */
router.get('/', optionalAuth, ProductController.getAllProducts);

/**
 * @route   GET /api/products/search
 * @desc    Buscar productos
 * @access  Público
 */
router.get('/search', optionalAuth, ProductController.searchProducts);

/**
 * @route   GET /api/products/category/:category
 * @desc    Obtener productos por categoría
 * @access  Público
 */
router.get('/category/:category', optionalAuth, ProductController.getProductsByCategory);

/**
 * @route   GET /api/products/:id
 * @desc    Obtener producto específico
 * @access  Público
 */
router.get('/:id', optionalAuth, ProductController.getProductById);

// ===========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ===========================================

/**
 * @route   POST /api/products
 * @desc    Crear nuevo producto
 * @access  Privado
 */
router.post('/', verifyToken, ProductController.createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Actualizar producto
 * @access  Privado (solo creador)
 */
router.put('/:id', verifyToken, ProductController.updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Eliminar producto (soft delete)
 * @access  Privado (solo creador)
 */
router.delete('/:id', verifyToken, ProductController.deleteProduct);

module.exports = router;