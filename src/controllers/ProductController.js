/**
 * Controlador de Producto - Capa de Presentación
 * Responsabilidades: Manejar peticiones HTTP de productos
 */

const ProductService = require('../services/productService');
//const { User, Product } = require('../models');
class ProductController {
  /**
   * Obtener producto por ID
   * GET /api/products/:id
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;

      // Validar formato UUID
      if (!this._isValidUUID(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de producto inválido'
        });
      }

      const result = await ProductService.getProductById(id);

      res.status(200).json({
        success: true,
        data: {
          product: result.product
        }
      });

    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Actualizar producto
   * PUT /api/products/:id
   */
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.userId;

      // Validar ID
      if (!this._isValidUUID(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de producto inválido'
        });
      }

      const result = await ProductService.updateProduct(id, updateData, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          product: result.product
        }
      });

    } catch (error) {
      if (error.statusCode === 403 || error.statusCode === 404) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Eliminar producto
   * DELETE /api/products/:id
   */
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      if (!this._isValidUUID(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de producto inválido'
        });
      }

      const result = await ProductService.deleteProduct(id, userId);

      res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      if (error.statusCode === 403 || error.statusCode === 404) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Buscar productos
   * GET /api/products/search?q=termino
   */
  async searchProducts(req, res, next) {
    try {
      const { q: searchTerm, page, limit } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El término de búsqueda debe tener al menos 2 caracteres'
        });
      }

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 12
      };

      const result = await ProductService.searchProducts(searchTerm.trim(), options);

      res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener productos por categoría
   * GET /api/products/category/:category
   */
  async getProductsByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const { page, limit } = req.query;

      const validCategories = ['Libros', 'Ropa'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Categoría no válida'
        });
      }

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 12
      };

      const result = await ProductService.getProductsByCategory(category, options);

      res.status(200).json({
        success: true,
        data: {
          products: result.products,
          category: result.category
        }
      });

    } catch (error) {
      next(error);
    }
  }

async createProduct(req, res, next) {
  try {
    const { name, description, price, category, stock, images, tags } = req.body;
      const createdBy = req.user.userId;

      // Validación básica
      if (!name || !description || !price || !category) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, descripción, precio y categoría son obligatorios'
        });
      }

      // Preparar datos del producto
      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        stock: stock || 0,
        images: images || [],
        tags: tags || []
      };

      // Crear producto
      const result = await ProductService.createProduct(productData, createdBy);

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          product: result.product
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todos los productos con filtros
   * GET /api/products
   */
  async getAllProducts(req, res, next) {
    try {
      const {
        page,
        limit,
        category,
        minPrice,
        maxPrice,
        search,
        sortBy,
        sortOrder,
        inStock
      } = req.query;

      // Preparar opciones
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 12,
        category,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        search,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
        inStock
      };

      const result = await ProductService.getAllProducts(options);

      res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (error) {
      next(error);
    }
  }


  // ===========================================
  // MÉTODOS HELPER
  // ===========================================

  /**
   * Validar UUID v4
   */
  _isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

// Exportar instancia del controlador
module.exports = new ProductController();
/* Crear nuevo producto
/*
 * Crear nuevo producto
 * POST /api/products
 */



 
