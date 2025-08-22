import { asyncWrapper } from '../utils/asyncWrapper.js';
import { HttpError } from '../utils/error.js';
import categoryService from '../services/category.js';

const categoryController = {
  getAllCategories: asyncWrapper(async (req, res) => {
    const { page, limit, search } = req.query;

    if (req.path.includes('/public/')) {
      try {
        const categoriesData = await categoryService.getCategoriesForDropdown();
        const formattedCategories = categoriesData
          .filter(category => category.label && category.label.trim() !== '')
          .map(category => ({
            id: category.id,
            name: category.label || category.key || 'Unknown Category'
          }));

        res.status(200).json({
          success: true,
          message: 'Categories retrieved successfully',
          data: formattedCategories
        });
      } catch {
        res.status(200).json({
          success: true,
          message: 'Categories retrieved successfully (fallback)',
          data: [{ id: null, name: 'Semua Artikel' }]
        });
      }
    } else {
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search
      };

      try {
        const result = await categoryService.getAllCategories(options);
        const categoriesArray = result.categories || result.data || result || [];
        const formattedCategories = categoriesArray
          .filter(category =>
            category.name &&
            category.name.trim() !== '' &&
            category.name !== 'Unnamed Category' &&
            category.name !== 'Unknown Category'
          )
          .map(category => ({
            id: category.id,
            name: category.name || 'Unknown Category'
          }));

        res.status(200).json({
          success: true,
          message: 'Categories retrieved successfully',
          data: formattedCategories,
          pagination: {
            currentPage: result.currentPage || 1,
            totalPages: result.totalPages || 1,
            totalItems: result.totalItems || formattedCategories.length,
            hasNext: result.hasNext || false,
            hasPrev: result.hasPrev || false
          }
        });
      } catch {
        res.status(200).json({
          success: true,
          message: 'Categories retrieved successfully (fallback)',
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            hasNext: false,
            hasPrev: false
          }
        });
      }
    }
  }),

  getCategoriesWithCount: asyncWrapper(async (req, res) => {
    try {
      const categories = await categoryService.getCategoriesWithArticleCount();
      let categoriesArray = [];

      if (Array.isArray(categories)) {
        categoriesArray = categories;
      } else if (categories.data && Array.isArray(categories.data)) {
        categoriesArray = categories.data;
      } else if (categories.categories && Array.isArray(categories.categories)) {
        categoriesArray = categories.categories;
      }

      const formattedCategories = categoriesArray
        .filter(category =>
          category.name &&
          category.name.trim() !== '' &&
          category.name !== 'Unnamed Category' &&
          category.name !== 'Unknown Category'
        )
        .map(category => ({
          id: category.id,
          name: category.name,
          article_count: category.published_articles || category.articleCount || category.article_count || 0
        }));

      res.status(200).json({
        success: true,
        message: 'Categories with count retrieved successfully',
        data: formattedCategories
      });
    } catch {
      try {
        const basicCategories = await categoryService.getCategoriesForDropdown();
        const fallbackCategories = basicCategories
          .filter(category =>
            category.label &&
            category.label.trim() !== '' &&
            category.key !== 'Semua Artikel'
          )
          .map(category => ({
            id: category.id,
            name: category.label,
            article_count: 0
          }));

        res.status(200).json({
          success: true,
          message: 'Categories retrieved successfully (fallback)',
          data: fallbackCategories
        });
      } catch {
        res.status(200).json({
          success: true,
          message: 'Categories retrieved successfully (empty fallback)',
          data: []
        });
      }
    }
  }),

  getCategoryById: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);

    if (!category) {
      throw new HttpError('Category not found', 404);
    }

    if (!category.name || category.name.trim() === '') {
      throw new HttpError('Category has invalid data', 400);
    }

    const formattedCategory = {
      id: category.id,
      name: category.name
    };

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: formattedCategory
    });
  }),

  createCategory: asyncWrapper(async (req, res) => {
    let categoryName;

    if (req.body.name) {
      categoryName = req.body.name.trim();
    } else if (req.body.nama_kategori) {
      categoryName = req.body.nama_kategori.trim();
    } else {
      throw new HttpError('Nama kategori tidak boleh kosong', 400);
    }

    if (!categoryName || categoryName === '') {
      throw new HttpError('Nama kategori tidak boleh kosong atau hanya berisi spasi', 400);
    }

    const categoryData = {
      nama_kategori: categoryName,
      author_id: res.locals.user?.id
    };

    try {
      const category = await categoryService.createCategory(categoryData);

      if (!category || !category.id) {
        throw new HttpError('Gagal membuat kategori - data tidak valid', 500);
      }

      if (!category.name || category.name.trim() === '') {
        throw new HttpError('Gagal membuat kategori - nama kategori tidak valid', 500);
      }

      const formattedCategory = {
        id: category.id,
        name: category.name
      };

      res.status(201).json({
        success: true,
        message: 'Kategori berhasil ditambahkan',
        data: formattedCategory
      });
    } catch (error) {
      if (error.statusCode === 400) {
        throw new HttpError(error.message || 'Gagal membuat kategori', 400);
      }
      throw new HttpError('Gagal membuat kategori', 500);
    }
  }),

  updateCategory: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    let categoryName;

    if (req.body.name) {
      categoryName = req.body.name.trim();
    } else if (req.body.nama_kategori) {
      categoryName = req.body.nama_kategori.trim();
    } else {
      throw new HttpError('Nama kategori tidak boleh kosong', 400);
    }

    if (!categoryName || categoryName === '') {
      throw new HttpError('Nama kategori tidak boleh kosong atau hanya berisi spasi', 400);
    }

    const updateData = { nama_kategori: categoryName };

    try {
      const updatedCategory = await categoryService.updateCategory(id, updateData);

      if (!updatedCategory || !updatedCategory.name || updatedCategory.name.trim() === '') {
        throw new HttpError('Gagal memperbarui kategori - data tidak valid', 500);
      }

      const formattedCategory = {
        id: updatedCategory.id,
        name: updatedCategory.name
      };

      res.status(200).json({
        success: true,
        message: 'Kategori berhasil diperbarui',
        data: formattedCategory
      });
    } catch (error) {
      if (error.statusCode === 404) {
        throw new HttpError('Kategori tidak ditemukan', 404);
      } else if (error.statusCode === 400) {
        throw new HttpError(error.message || 'Kategori sudah ada', 400);
      }
      throw new HttpError('Gagal memperbarui kategori', 500);
    }
  }),

  deleteCategory: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    try {
      const result = await categoryService.deleteCategory(id);

      return res.status(200).json({
        success: true,
        message: result.message || 'Kategori berhasil dihapus',
        refreshRequired: true,
        refreshType: 'articles',
        deletedCategoryId: id
      });
    } catch (error) {
      let statusCode = 500;
      let errorMessage = 'Terjadi kesalahan saat menghapus kategori';

      if (error && error.statusCode !== undefined) {
        const rawStatusCode = error.statusCode;
        if (typeof rawStatusCode === 'string') {
          const parsed = parseInt(rawStatusCode);
          if (!isNaN(parsed) && parsed >= 100 && parsed <= 599) {
            statusCode = parsed;
          }
        } else if (typeof rawStatusCode === 'number' && rawStatusCode >= 100 && rawStatusCode <= 599) {
          statusCode = rawStatusCode;
        }
      }

      if (error && error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }

      if (error.code === 'P2003' || (error.message && error.message.includes('foreign key constraint'))) {
        statusCode = 400;
        errorMessage = 'Tidak dapat menghapus kategori yang masih memiliki artikel terkait.';
      }

      if (typeof statusCode !== 'number' || statusCode < 100 || statusCode > 599) {
        statusCode = 500;
        errorMessage = 'Terjadi kesalahan server';
      }

      return res.status(statusCode).json({
        success: false,
        message: errorMessage
      });
    }
  })
};

export default categoryController;
