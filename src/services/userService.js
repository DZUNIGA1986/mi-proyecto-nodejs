/**
 * Servicio de Usuario
 * Lógica de negocio para operaciones de usuarios
 */



const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

class UserService {
  /**
   * Registrar nuevo usuario
   */
  async createUser(userData) {
    try {
      const { name, email, password, role } = userData;

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        throw new Error('El email ya está registrado');
      }

      // Crear usuario (el password se hashea automáticamente por el hook beforeCreate)
      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase(),
        password,
        role: role || 'user'
      });

      // Generar token
      const token = this.generateToken(user.id);

      return {
        success: true,
        user: user.getPublicProfile(),
        token
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Autenticar usuario (login)
   */
  async authenticateUser(email, password) {
    try {
      // Buscar usuario con password incluido
      const user = await User.scope('withPassword').findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar si está activo
      if (!user.isActive) {
        throw new Error('Credenciales inválidas');
      }

      // Comparar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error('Credenciales inválidas');
      }

      // Actualizar último login
      user.lastLogin = new Date();
      await user.save({ fields: ['lastLogin'], hooks: false });

      // Generar token
      const token = this.generateToken(user.id);

      return {
        success: true,
        user: user.getPublicProfile(),
        token
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return {
        success: true,
        data: user.getPublicProfile()
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios
   */
  async getAllUsers(filters = {}) {
    try {
      const { role, isActive, limit = 50, offset = 0 } = filters;

      const where = {};
      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive;

      const users = await User.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        data: {
          users: users.rows.map(user => user.getPublicProfile()),
          total: users.count,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar usuario
   */
  async updateUser(userId, updateData) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // No permitir actualizar password directamente
      if (updateData.password) {
        delete updateData.password;
      }

      // Actualizar usuario
      await user.update(updateData);

      return {
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: user.getPublicProfile()
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.scope('withPassword').findByPk(userId);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Actualizar contraseña (se hasheará automáticamente por el hook)
      user.password = newPassword;
      await user.save();

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar usuario (soft delete)
   */
  async deleteUser(userId) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Desactivar usuario en lugar de eliminarlo
      await user.update({ isActive: false });

      return {
        success: true,
        message: 'Usuario eliminado exitosamente'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generar token JWT
   */
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'tu_secreto_jwt',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getStats() {
    try {
      const stats = await User.getStats();

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();