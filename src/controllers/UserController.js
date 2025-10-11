/**
 * Controlador de Usuario - Capa de Presentación
 * Responsabilidades: Manejar peticiones HTTP, validar entrada, enviar respuestas
 */
//const { User, Product } = require('../models');
const UserService = require('../services/UserService');

class UserController {
  /**
   * Registrar nuevo usuario
   * POST /api/users/register
   */
  async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;

      // Validación básica de entrada
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, email y contraseña son obligatorios'
        });
      }

      // Llamar al servicio
      const result = await UserService.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role || 'user'
      });

      // Respuesta exitosa
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: result.user,
          token: result.token
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Iniciar sesión
   * POST /api/users/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      console.log('req.body recibido:', req.body);

      // Validación de entrada
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son obligatorios'
        });
      }

      // Autenticar usuario
      const result = await UserService.authenticateUser(
        email.trim().toLowerCase(),
        password
      );

      // Respuesta exitosa
      res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          user: result.user,
          token: result.token
        }
      });

    } catch (error) {
      // Los errores de autenticación deben retornar 401
      if (error.message.includes('Credenciales inválidas')) {
        error.statusCode = 401;
      }
      next(error);
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   * GET /api/users/profile
   */
  async getProfile(req, res, next) {
    try {
      // El middleware de auth ya agregó req.user
      const result = await UserService.getUserProfile(req.user.userId);

      res.status(200).json({
        success: true,
        data: result.user
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar perfil del usuario
   * PUT /api/users/profile
   */
  async updateProfile(req, res, next) {
    try {
      const { name, profile } = req.body;
      const userId = req.user.userId;

      // Construir datos de actualización
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (profile) updateData.profile = profile;

      // Actualizar perfil
      const result = await UserService.updateUserProfile(userId, updateData);

      res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: result.user
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Cambiar contraseña
   * PUT /api/users/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = req.user.userId;

      // Validaciones de entrada
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos de contraseña son obligatorios'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden'
        });
      }

      if (newPassword === currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe ser diferente a la actual'
        });
      }

      // Cambiar contraseña
      const result = await UserService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      if (error.message.includes('Contraseña actual incorrecta')) {
        error.statusCode = 400;
      }
      next(error);
    }
  }

  /**
   * Obtener todos los usuarios (solo admin)
   * GET /api/users
   */
  async getAllUsers(req, res, next) {
    try {
      // Verificar que el usuario es admin (esto debería hacerse en middleware)
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Se requieren privilegios de administrador'
        });
      }

      // Extraer parámetros de query
      const {
        page = 1,
        limit = 10,
        role,
        isActive,
        search,
        createdAfter
      } = req.query;

      // Construir filtros
      const filters = {};
      if (role) filters.role = role;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (search) filters.search = search;
      if (createdAfter) filters.createdAfter = createdAfter;

      // Obtener usuarios
      const result = await UserService.getAllUsers(
        parseInt(page),
        parseInt(limit),
        filters
      );

      res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener un usuario específico por ID
   * GET /api/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      // Validar formato de ID
      if (!this._isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
      }

      // Verificar permisos: solo el propio usuario o admin
      if (req.user.userId !== id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver este perfil'
        });
      }

      const result = await UserService.getUserProfile(id);

      res.status(200).json({
        success: true,
        data: result.user
      });

    } catch (error) {
      if (error.message.includes('Usuario no encontrado')) {
        error.statusCode = 404;
      }
      next(error);
    }
  }

  /**
   * Desactivar usuario (solo admin)
   * DELETE /api/users/:id
   */
  async deactivateUser(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar permisos de admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado'
        });
      }

      // Validar ID
      if (!this._isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
      }

      // Evitar que el admin se desactive a sí mismo
      if (req.user.userId === id) {
        return res.status(400).json({
          success: false,
          message: 'No puedes desactivar tu propia cuenta'
        });
      }

      const result = await UserService.deactivateUser(id);

      res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener estadísticas de usuarios (solo admin)
   * GET /api/users/stats
   */
  async getUserStats(req, res, next) {
    try {
      // Verificar permisos de admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado'
        });
      }

      const result = await UserService.getUserStats();

      res.status(200).json({
        success: true,
        data: result.stats
      });

    } catch (error) {
      next(error);
    }
  }

  // ===========================================
  // MÉTODOS HELPER
  // ===========================================

  /**
   * Validar ObjectId de MongoDB
   */
  _isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}

// Exportar instancia del controlador
module.exports = new UserController();