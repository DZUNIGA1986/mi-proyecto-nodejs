const Category = require('../models/Category');

class CategoryService {
    // Obtener todas las categorías
    static async getAllCategories() {
        try {
            const categories = await Category.findAll({
                attributes: ['id', 'description'],
                order: [['description', 'ASC']]
            });

            if (!categories || categories.length === 0) {
                return {
                    success: true,
                    message: 'No hay categorías disponibles',
                    data: []
                };
            }

            return {
                success: true,
                message: 'Categorías obtenidas exitosamente',
                data: categories.map(cat => cat.toJSON())
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al obtener las categorías',
                error: error.message
            };
        }
    }

    // Obtener categoría por ID
    static async getCategoryById(id) {
        try {
            if (!id) {
                return {
                    success: false,
                    message: 'ID de categoría es requerido'
                };
            }

            const category = await Category.findByPk(id, {
                attributes: ['id', 'description']
            });
            
            if (!category) {
                return {
                    success: false,
                    message: 'Categoría no encontrada'
                };
            }

            return {
                success: true,
                message: 'Categoría encontrada',
                data: category.toJSON()
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al obtener la categoría',
                error: error.message
            };
        }
    }

    // Crear nueva categoría
    static async createCategory(description) {
        try {
            if (!description) {
                return {
                    success: false,
                    message: 'La descripción es requerida'
                };
            }

            const category = await Category.create({ description });

            return {
                success: true,
                message: 'Categoría creada exitosamente',
                data: category.toJSON()
            };
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return {
                    success: false,
                    message: 'La categoría ya existe'
                };
            }

            return {
                success: false,
                message: 'Error al crear la categoría',
                error: error.message
            };
        }
    }
}

module.exports = CategoryService;