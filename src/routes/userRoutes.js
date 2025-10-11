/**
 * Rutas de Usuario
 * Responsabilidades: Definir endpoints y middlewares para usuarios
 */

const express = require('express');
const UserController = require('../controllers/UserController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ===========================================
// RUTAS PÚBLICAS (sin autenticación)
// ===========================================

/**
 * @route   POST /api/users/register
 * @desc    Registrar nuevo usuario
 * @access  Público
 */
router.post('/register', UserController.register);

/**
 * @route   POST /api/users/login
 * @desc    Iniciar sesión
 * @access  Público
 */
router.post('/login', UserController.login);

// ===========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ===========================================

/**
 * @route   GET /api/users/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Privado
 */
router.get('/profile', verifyToken, UserController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Actualizar perfil del usuario
 * @access  Privado
 */
router.put('/profile', verifyToken, UserController.updateProfile);

/**
 * @route   PUT /api/users/change-password
 * @desc    Cambiar contraseña del usuario
 * @access  Privado
 */
router.put('/change-password', verifyToken, UserController.changePassword);

/**
 * @route   GET /api/users/:id
 * @desc    Obtener perfil de usuario específico
 * @access  Privado (solo propio perfil o admin)
 */
router.get('/:id', verifyToken, UserController.getUserById);

// ===========================================
// RUTAS DE ADMINISTRADOR
// ===========================================

/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios
 * @access  Admin
 */
router.get('/', verifyToken, requireAdmin, UserController.getAllUsers);

/**
 * @route   GET /api/users/stats/overview
 * @desc    Obtener estadísticas de usuarios
 * @access  Admin
 */
router.get('/stats/overview', verifyToken, requireAdmin, UserController.getUserStats);

/**
 * @route   DELETE /api/users/:id
 * @desc    Desactivar usuario
 * @access  Admin
 */
router.delete('/:id', verifyToken, requireAdmin, UserController.deactivateUser);

module.exports = router;