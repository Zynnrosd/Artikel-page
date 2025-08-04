import categoryService from '../services/category.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { HttpError } from '../utils/error.js';

const categoryController = {
  
  getAllCategories: asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search
    };

    const result = await categoryService.getAllCategories(options);
    
    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: result.categories,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    });
  }),

  getCategoryById: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    
    if (!category) {
      throw new HttpError('Category not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: category
    });
  }),

  createCategory: asyncWrapper(async (req, res) => {
    console.log('=== CREATE CATEGORY DEBUG ===');
    console.log('req.body:', req.body);
    // ✅ PERUBAHAN: Tidak ada lagi custom_author logging
    
    const categoryData = {
      ...req.body,
      author_id: res.locals.user.id
    };

    const category = await categoryService.createCategory(categoryData);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  }),

  updateCategory: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    console.log('=== UPDATE CATEGORY DEBUG ===');
    console.log('Category ID:', id);
    console.log('Update data:', updateData);

    const category = await categoryService.updateCategory(id, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  }),

  deleteCategory: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    
    await categoryService.deleteCategory(id);
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  }),

  getCategoriesWithCount: asyncWrapper(async (req, res) => {
    const categories = await categoryService.getCategoriesWithArticleCount();
    
    res.status(200).json({
      success: true,
      message: 'Categories with article count retrieved successfully',
      data: categories
    });
  })
};

export default categoryController;