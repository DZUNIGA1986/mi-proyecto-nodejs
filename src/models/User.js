/**
 * Modelo de Usuario usando PostgreSQL con Sequelize
 * Responsabilidades: Esquema, validaciones y métodos de instancia
 */

const bcrypt = require('bcryptjs');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre es obligatorio'
      },
      len: {
        args: [2, 50],
        msg: 'El nombre debe tener entre 2 y 50 caracteres'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Por favor ingresa un email válido'
      },
      notEmpty: {
        msg: 'El email es obligatorio'
      }
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [6, 255],
        msg: 'La contraseña debe tener al menos 6 caracteres'
      }
    }
  },
  role: {
    type: DataTypes.ENUM,
    values: ['user', 'admin'],
    defaultValue: 'user',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 500],
        msg: 'La biografía no puede exceder 500 caracteres'
      }
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true, // Crea automáticamente createdAt y updatedAt
  tableName: 'users',
  hooks: {
    // Hash password antes de crear
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // Hash password antes de actualizar
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  defaultScope: {
    // Excluir password por defecto
    attributes: {
      exclude: ['password']
    },
    where: {
      isActive: true
    }
  },
  scopes: {
    // Scope para incluir password
    withPassword: {
      attributes: {}
    },
    // Scope para incluir usuarios inactivos
    withInactive: {
      where: {}
    },
    // Scope para solo admins
    admins: {
      where: {
        role: 'admin'
      }
    }
  }
});

// Métodos de instancia
User.prototype.comparePassword = async function(candidatePassword) {
  // Necesitamos obtener el password ya que está excluido por defecto
  const userWithPassword = await User.scope('withPassword').findByPk(this.id);
  return await bcrypt.compare(candidatePassword, userWithPassword.password);
};

User.prototype.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save({ 
    fields: ['lastLogin'],
    hooks: false // No ejecutar hooks para esta actualización simple
  });
};

User.prototype.getPublicProfile = function() {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    bio: this.bio,
    phone: this.phone,
    joinedAt: this.createdAt,
    lastLogin: this.lastLogin
  };
};

User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

// Métodos estáticos
User.findByEmail = async function(email) {
  return await User.scope('withPassword').findOne({
    where: {
      email: email.toLowerCase()
    }
  });
};

User.getStats = async function() {
  const stats = await User.findAll({
    attributes: [
      'role',
      [sequelize.fn('COUNT', sequelize.col('role')), 'count'],
      [
        sequelize.fn('SUM', 
          sequelize.case()
            .when(sequelize.col('isActive'), 1)
            .else(0)
        ), 
        'active'
      ]
    ],
    group: ['role'],
    raw: true
  });

  return stats;
};

User.findActive = function() {
  return User.findAll({
    where: {
      isActive: true
    }
  });
};

// Definir asociaciones (si las necesitas)
User.associate = function(models) {
  // Ejemplo: User.hasMany(models.Post, { foreignKey: 'userId' });
};

module.exports = User;