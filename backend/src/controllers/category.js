import { asyncWrapper } from '../utils/asyncWrapper.js';
import { HttpError } from '../utils/error.js';
import categoryService from '../services/category.js';

const categoryController = {
  // ✅ FRONTEND NEEDS: Get all categories for dropdown and tabs
  getAllCategories: asyncWrapper(async (req, res) => {
    // ✅ FIX: Handle different response formats based on route
    const { page, limit, search } = req.query;
    
    if (req.path.includes('/public/')) {
      // For public routes, use simplified dropdown format
      const categoriesData = await categoryService.getCategoriesForDropdown();
      
      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categoriesData
      });
    } else {
      // For admin routes, use paginated format
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search
      };
      
      const result = await categoryService.getAllCategories(options);
      
      // ✅ FIX: Access the categories array from result
      const formattedCategories = result.categories.map(category => ({
        id: category.id,
        name: category.nama_kategori || category.name
      }));
      
      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: formattedCategories,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalItems: result.totalItems,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev
        }
      });
    }
  }),

  // ✅ FRONTEND NEEDS: Get categories with article count for display
  getCategoriesWithCount: asyncWrapper(async (req, res) => {
    const categories = await categoryService.getCategoriesWithArticleCount();
    
    // ✅ FIX: This method returns array directly
    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.nama_kategori || category.name,
      articleCount: category.published_articles || 0
    }));
    
    res.status(200).json({
      success: true,
      message: 'Categories with count retrieved successfully',
      data: formattedCategories
    });
  }),

  getCategoryById: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    
    if (!category) {
      throw new HttpError('Category not found', 404);
    }

    // ✅ FRONTEND FORMAT: Consistent format
    const formattedCategory = {
      id: category.id,
      name: category.nama_kategori || category.name
    };

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: formattedCategory
    });
  }),

  createCategory: asyncWrapper(async (req, res) => {
    console.log('=== CREATE CATEGORY DEBUG ===');
    console.log('req.body:', req.body);
    
    let categoryName;
    
    // ✅ FRONTEND COMPATIBILITY: Accept both 'name' and 'nama_kategori'
    if (req.body.name) {
      categoryName = req.body.name.trim();
    } else if (req.body.nama_kategori) {
      categoryName = req.body.nama_kategori.trim();
    } else {
      throw new HttpError('Nama kategori tidak boleh kosong', 400);
    }
    
    if (!categoryName) {
      throw new HttpError('Nama kategori tidak boleh kosong', 400);
    }

    // ✅ VALIDATION: Check duplicate name
    const existingCategory = await categoryService.getCategoryById(categoryName);
    if (existingCategory) {
      throw new HttpError('Kategori sudah ada', 400);
    }

    const categoryData = {
      nama_kategori: categoryName,
      author_id: res.locals.user?.id // Add author_id if available
    };

    const category = await categoryService.createCategory(categoryData);
    
    // ✅ FRONTEND FORMAT: Return in expected format
    const formattedCategory = {
      id: category.id,
      name: category.nama_kategori || category.name
    };
    
    res.status(201).json({
      success: true,
      message: 'Kategori berhasil ditambahkan',
      data: formattedCategory
    });
  }),

  updateCategory: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    
    console.log('=== UPDATE CATEGORY DEBUG ===');
    console.log('req.body:', req.body);
    console.log('category id:', id);
    
    let categoryName;
    
    // ✅ FRONTEND COMPATIBILITY: Accept both 'name' and 'nama_kategori'
    if (req.body.name) {
      categoryName = req.body.name.trim();
    } else if (req.body.nama_kategori) {
      categoryName = req.body.nama_kategori.trim();
    } else {
      throw new HttpError('Nama kategori tidak boleh kosong', 400);
    }

    if (!categoryName) {
      throw new HttpError('Nama kategori tidak boleh kosong', 400);
    }

    // ✅ VALIDATION: Check duplicate name (exclude current category)
    const existingCategory = await categoryService.getCategoryById(categoryName);
    if (existingCategory && existingCategory.id !== id) {
      throw new HttpError('Kategori sudah ada', 400);
    }

    const updateData = {
      nama_kategori: categoryName
    };

    const updatedCategory = await categoryService.updateCategory(id, updateData);
    
    // ✅ FRONTEND FORMAT: Return in expected format
    const formattedCategory = {
      id: updatedCategory.id,
      name: updatedCategory.nama_kategori || updatedCategory.name
    };
    
    res.status(200).json({
      success: true,
      message: 'Kategori berhasil diperbarui',
      data: formattedCategory
    });
  }),

  deleteCategory: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    console.log('=== DELETE CATEGORY DEBUG ===');
    console.log('category id:', id);

    // ✅ CHECK: If category has published articles
    const articlesQuery = `
      SELECT COUNT(*) as count 
      FROM articles 
      WHERE category_id = ? AND published_at IS NOT NULL
    `;
    
    const result = await prisma.$queryRawUnsafe(articlesQuery, id);
    const articlesCount = Number(result[0].count);
    
    if (articlesCount > 0) {
      throw new HttpError(
        `Cannot delete category. There are ${articlesCount} published article(s) using this category`,
        400
      );
    }

    await categoryService.deleteCategory(id);
    
    res.status(200).json({
      success: true,
      message: 'Kategori berhasil dihapus'
    });
  })
};

export default categoryController;