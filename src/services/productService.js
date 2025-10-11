/**
 * Servicio de Producto para PostgreSQL con Sequelize
 * Lógica de negocio para operaciones CRUD de productos
 */


const { sequelize } = require('../config/database');
const { Product, User } = require('../models');


class ProductService {
  /**
   * Crear nuevo producto
   */
  async createProduct(productData, createdBy) {
    try {
      // Validaciones de negocio
      this._validateProductData(productData);
      
      // Verificar que el usuario existe y está activo
      await this._validateUserExists(createdBy);

      // Procesar y limpiar datos
      const processedData = this._processProductData(productData);

      // Crear producto usando Sequelize
      const product = await Product.create({
        ...processedData,
        createdBy
      });

      return {
        success: true,
        product: this._formatProduct(product),
        message: 'Producto creado exitosamente'
      };

    } catch (error) {
      throw this._handleError(error, 'Error creando producto');
    }
  }

  /**
   * Obtener todos los productos con filtros
   */
  async getAllProducts(options = {}) {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        minPrice,
        maxPrice,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        inStock,
        userId
      } = options;

      this._validatePaginationParams(page, limit);

      const offset = (page - 1) * limit;

      // Construir condiciones where
      const where = { isActive: true };

      if (category) where.category = category;
      if (minPrice !== undefined) where.price = { ...where.price, [sequelize.Op.gte]: parseFloat(minPrice) };
      if (maxPrice !== undefined) where.price = { ...where.price, [sequelize.Op.lte]: parseFloat(maxPrice) };
      if (inStock === 'true') where.stock = { [sequelize.Op.gt]: 0 };
      if (userId) where.createdBy = userId;

      if (search) {
        where[sequelize.Op.or] = [
          { name: { [sequelize.Op.iLike]: `%${search}%` } },
          { description: { [sequelize.Op.iLike]: `%${search}%` } }
        ];
      }

      // Mapeo de campos para ordenamiento
      const sortMap = {
        'created_at': 'createdAt',
        'rating_average': 'ratingAverage',
        'name': 'name',
        'price': 'price',
        'stock': 'stock'
      };

      const { count, rows } = await Product.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortMap[sortBy] || 'createdAt', sortOrder.toUpperCase()]],
        include: [{
          model: User,
          as: 'creator',
          attributes: ['name', 'email']
        }]
      });

      return {
        success: true,
        data: {
          products: rows.map(p => this._formatProductWithCreator(p)),
          pagination: {
            current: parseInt(page),
            total: Math.ceil(count / limit),
            count: rows.length,
            totalRecords: count
          }
        }
      };

    } catch (error) {
      throw this._handleError(error, 'Error obteniendo productos');
    }
  }

  /**
   * Obtener producto por ID
   */
  async getProductById(productId) {
    try {
      const product = await Product.findByPk(productId, {
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }]
      });

      if (!product) {
        const error = new Error('Producto no encontrado');
        error.statusCode = 404;
        throw error;
      }

      if (!product.isActive) {
        const error = new Error('Producto no disponible');
        error.statusCode = 410;
        throw error;
      }

      return {
        success: true,
        product: this._formatProductWithCreator(product)
      };

    } catch (error) {
      throw this._handleError(error, 'Error obteniendo producto');
    }
  }

  /**
   * Actualizar producto
   */
  async updateProduct(productId, updateData, userId) {
    try {
      const product = await Product.findByPk(productId);

      if (!product) {
        const error = new Error('Producto no encontrado');
        error.statusCode = 404;
        throw error;
      }

      if (!product.isActive) {
        const error = new Error('Producto no disponible');
        error.statusCode = 410;
        throw error;
      }

      // Verificar permisos
      if (product.createdBy !== userId) {
        const error = new Error('No tienes permisos para editar este producto');
        error.statusCode = 403;
        throw error;
      }

      // Validar datos
      this._validateUpdateData(updateData, product);

      // Actualizar
      await product.update(updateData);

      return {
        success: true,
        product: this._formatProduct(product),
        message: 'Producto actualizado exitosamente'
      };

    } catch (error) {
      throw this._handleError(error, 'Error actualizando producto');
    }
  }

  /**
   * Eliminar producto (soft delete)
   */
  async deleteProduct(productId, userId) {
    try {
      const product = await Product.findByPk(productId);

      if (!product) {
        const error = new Error('Producto no encontrado');
        error.statusCode = 404;
        throw error;
      }

      if (!product.isActive) {
        const error = new Error('Producto ya eliminado');
        error.statusCode = 410;
        throw error;
      }

      // Verificar permisos
      if (product.createdBy !== userId) {
        const error = new Error('No tienes permisos para eliminar este producto');
        error.statusCode = 403;
        throw error;
      }

      // Soft delete
      await product.update({ isActive: false });

      return {
        success: true,
        message: 'Producto eliminado exitosamente'
      };

    } catch (error) {
      throw this._handleError(error, 'Error eliminando producto');
    }
  }

  /**
   * Buscar productos
   */
  async searchProducts(searchTerm, options = {}) {
    try {
      const { page = 1, limit = 12 } = options;
      const offset = (page - 1) * limit;

      const cleanSearchTerm = searchTerm.trim();
      
      if (cleanSearchTerm.length < 2) {
        throw new Error('El término de búsqueda debe tener al menos 2 caracteres');
      }

      const where = {
        isActive: true,
        [sequelize.Op.or]: [
          { name: { [sequelize.Op.iLike]: `%${cleanSearchTerm}%` } },
          { description: { [sequelize.Op.iLike]: `%${cleanSearchTerm}%` } }
        ]
      };

      const { count, rows } = await Product.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [{
          model: User,
          as: 'creator',
          attributes: ['name', 'email']
        }]
      });

      return {
        success: true,
        data: {
          products: rows.map(p => this._formatProductWithCreator(p)),
          searchTerm: cleanSearchTerm,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(count / limit),
            count: rows.length,
            totalRecords: count
          }
        }
      };

    } catch (error) {
      throw this._handleError(error, 'Error en búsqueda de productos');
    }
  }

  /**
   * Obtener productos por categoría
   */
  async getProductsByCategory(category, options = {}) {
    try {
      const { page = 1, limit = 12 } = options;
      const offset = (page - 1) * limit;

     // this._validateCategory(category);

      const { count, rows } = await Product.findAndCountAll({
        where: {
          category,
          isActive: true
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['ratingAverage', 'DESC'], ['createdAt', 'DESC']],
        include: [{
          model: User,
          as: 'creator',
          attributes: ['name']
        }]
      });

      // Estadísticas
      const stats = await Product.findOne({
        where: { category, isActive: true },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('price')), 'avgPrice'],
          [sequelize.fn('MIN', sequelize.col('price')), 'minPrice'],
          [sequelize.fn('MAX', sequelize.col('price')), 'maxPrice'],
          [sequelize.fn('SUM', sequelize.col('stock')), 'totalStock']
        ],
        raw: true
      });

      return {
        success: true,
        data: {
          products: rows.map(p => this._formatProductWithCreator(p)),
          category,
          statistics: {
            totalProducts: count,
            averagePrice: parseFloat(stats.avgPrice) || 0,
            priceRange: {
              min: parseFloat(stats.minPrice) || 0,
              max: parseFloat(stats.maxPrice) || 0
            },
            totalStock: parseInt(stats.totalStock) || 0
          }
        }
      };

    } catch (error) {
      throw this._handleError(error, 'Error obteniendo productos por categoría');
    }
  }

  // ===========================================
  // MÉTODOS PRIVADOS (Validaciones y Helpers)
  // ===========================================

  _validateProductData(data) {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    if (data.name.length > 100) {
      throw new Error('El nombre no puede exceder 100 caracteres');
    }

    if (!data.description || data.description.trim().length < 10) {
      throw new Error('La descripción debe tener al menos 10 caracteres');
    }

    this._validatePrice(data.price);
    this._validateStock(data.stock);
   // this._validateCategory(data.category);
  }

  _validatePrice(price) {
    if (typeof price !== 'number' || price < 0) {
      throw new Error('El precio debe ser un número positivo');
    }

    if (price > 999999.99) {
      throw new Error('El precio no puede exceder $999,999.99');
    }
  }

  _validateStock(stock) {
    if (typeof stock !== 'number' || stock < 0) {
      throw new Error('El stock debe ser un número positivo o cero');
    }

    if (!Number.isInteger(stock)) {
      throw new Error('El stock debe ser un número entero');
    }
  }

  /*_validateCategory(category) {
    const validCategories = ['electronics', 'clothing', 'books', 'home', 'sports', 'toys'];
    
    if (!category || !validCategories.includes(category)) {
      throw new Error(`Categoría no válida. Categorías permitidas: ${validCategories.join(', ')}`);
    }
  }*/

  _validatePaginationParams(page, limit) {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new Error('Parámetros de paginación inválidos');
    }
  }

  _processProductData(data) {
    return {
      name: data.name.trim(),
      description: data.description.trim(),
      price: parseFloat(parseFloat(data.price).toFixed(2)),
      category: data.category.trim(),
      stock: parseInt(data.stock) || 0,
      images: data.images || [],
      tags: data.tags ? data.tags.map(tag => tag.toLowerCase().trim()) : []
    };
  }

  _formatProduct(product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      category: product.category,
      stock: product.stock,
      images: product.images,
      tags: product.tags,
      isActive: product.isActive,
      rating: {
        average: parseFloat(product.ratingAverage) || 0,
        count: parseInt(product.ratingCount) || 0
      },
      inStock: product.stock > 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  }

  _formatProductWithCreator(product) {
    const formatted = this._formatProduct(product);
    
    if (product.creator) {
      formatted.creator = {
        name: product.creator.name,
        email: product.creator.email
      };
    }
    
    return formatted;
  }

  async _validateUserExists(userId) {
    const user = await User.findByPk(userId);

    if (!user || !user.isActive) {
      throw new Error('Usuario no encontrado o inactivo');
    }
  }

  _validateUpdateData(updateData, existingProduct) {
    if (updateData.name !== undefined && updateData.name.trim().length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    if (updateData.description !== undefined && updateData.description.trim().length < 10) {
      throw new Error('La descripción debe tener al menos 10 caracteres');
    }

    if (updateData.price !== undefined) {
      this._validatePrice(updateData.price);
    }

    if (updateData.stock !== undefined) {
      this._validateStock(updateData.stock);
    }

  /*  if (updateData.category !== undefined) {
      this._validateCategory(updateData.category);
    }*/
  }

  _handleError(error, context) {
    console.error(`${context}:`, error);

    if (error.statusCode) {
      return error;
    }

    // Errores de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return new Error(error.errors[0].message);
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return new Error('Ya existe un producto con esos datos');
    }

    const knownErrors = [
      'nombre debe tener',
      'descripción debe tener',
      'precio debe ser',
      'stock debe ser',
      'categoría',
      'Producto no encontrado',
      'permisos para'
    ];

    if (knownErrors.some(msg => error.message.includes(msg))) {
      return error;
    }

    const newError = new Error(`${context}: ${error.message}`);
    newError.statusCode = 500;
    return newError;
  }
}

module.exports = new ProductService();