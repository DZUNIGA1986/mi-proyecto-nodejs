/**
 * Middleware de Autenticación JWT
 * Responsabilidades: Verificar tokens y proteger rutas
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthMiddleware {
  /**
   * Verificar token JWT
   */
  async verifyToken(req, res, next) {
    try {
      let token;

      // Obtener token del header
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token de acceso requerido'
        });
      }

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar usuario en base de datos usando Sequelize
      const user = await User.scope('withPassword').findByPk(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido - usuario no encontrado'
        });
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Cuenta desactivada'
        });
      }

      // Agregar usuario a la request
      req.user = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      console.error('Error en verificación de token:', error);

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Verificar rol de administrador
   */
  async requireAdmin(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Autenticación requerida'
        });
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Se requieren privilegios de administrador'
        });
      }

      next();
    } catch (error) {
      console.error('Error verificando rol admin:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Middleware opcional - no falla si no hay token
   */
  async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer')) {
        return next(); // Continuar sin autenticación
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findByPk(decoded.userId);

      if (user && user.isActive) {
        req.user = {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
      }

      next();
    } catch (error) {
      // En caso de error, simplemente continuar sin autenticación
      next();
    }
  }
}

const authMiddleware = new AuthMiddleware();

module.exports = {
  verifyToken: authMiddleware.verifyToken.bind(authMiddleware),
  requireAdmin: authMiddleware.requireAdmin.bind(authMiddleware),
  optionalAuth: authMiddleware.optionalAuth.bind(authMiddleware)
};