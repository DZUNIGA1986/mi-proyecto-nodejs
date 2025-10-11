const CategoryService = require('../services/categoryService');

class CategoryController {
    // GET /api/categories
    static async getAllCategories(req, res) {
        try {
            const result = await CategoryService.getAllCategories();
            
            const statusCode = result.success ? 200 : 500;
            return res.status(statusCode).json(result);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // GET /api/categories/:id
    static async getCategoryById(req, res) {
        try {
            const { id } = req.params;
            const result = await CategoryService.getCategoryById(id);
            
            const statusCode = result.success ? 200 : 404;
            return res.status(statusCode).json(result);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // POST /api/categories
    static async createCategory(req, res) {
        try {
            const { description } = req.body;
            const result = await CategoryService.createCategory(description);
            
            const statusCode = result.success ? 201 : 400;
            return res.status(statusCode).json(result);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}

module.exports = CategoryController;