import { prisma } from '../utils/db.js';
import { HttpError } from '../utils/error.js';
import { randomUUID } from 'crypto';

const categoryService = {
  transformCategoryForFrontend(category) {
    if (!category) return null;
    return {
      id: category.id_kategori,
      name: category.nama_kategori || 'Unknown Category',
      label: category.nama_kategori || 'Unknown Category',
      key: category.nama_kategori || 'Unknown Category',
      createdAt: category.created_at,
      updatedAt: category.updated_at,
      author: category.author_name || 'Unknown Author',
      id_kategori: category.id_kategori,
      nama_kategori: category.nama_kategori,
      author_id: category.author_id,
      author_name: category.author_name || 'Unknown Author',
      author_email: category.author_email || '',
      author_display: category.author_name || 'Unknown Author'
    };
  },

  async getAllCategories(options = {}) {
    const { page = 1, limit = 10, search, includeArticleCount = false } = options;
    const offset = (page - 1) * limit;

    let whereConditions = ['c.deleted_at IS NULL'];
    let queryParams = [];

    if (search) {
      whereConditions.push(`c.nama_kategori LIKE ?`);
      queryParams.push(`%${search}%`);
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM categories c ${whereClause}`;
    const countResult = await prisma.$queryRawUnsafe(countQuery, ...queryParams);
    const totalItems = Number(countResult[0].total);
    const totalPages = Math.ceil(totalItems / limit);

    let categoriesQuery;
    if (includeArticleCount) {
      categoriesQuery = `
        SELECT c.id_kategori, c.nama_kategori, c.created_at, c.updated_at,
          COALESCE(u.id, '') as author_id,
          COALESCE(u.name, 'System') as author_name,
          COALESCE(u.email, '') as author_email,
          COUNT(a.id) as total_articles,
          COUNT(CASE WHEN a.published_at IS NOT NULL THEN 1 END) as published_articles
        FROM categories c
        LEFT JOIN users u ON c.author_id = u.id
        LEFT JOIN articles a ON c.id_kategori = a.category_id
        ${whereClause}
        GROUP BY c.id_kategori, c.nama_kategori, c.created_at, c.updated_at, u.id, u.name, u.email
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `;
    } else {
      categoriesQuery = `
        SELECT c.id_kategori, c.nama_kategori, c.created_at, c.updated_at,
          COALESCE(u.id, '') as author_id,
          COALESCE(u.name, 'System') as author_name,
          COALESCE(u.email, '') as author_email
        FROM categories c
        LEFT JOIN users u ON c.author_id = u.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `;
    }

    queryParams.push(limit, offset);
    const categories = await prisma.$queryRawUnsafe(categoriesQuery, ...queryParams);

    const transformedCategories = categories.map(category => {
      const transformed = this.transformCategoryForFrontend(category);
      if (includeArticleCount) {
        transformed.total_articles = Number(category.total_articles) || 0;
        transformed.published_articles = Number(category.published_articles) || 0;
      }
      return transformed;
    });

    return {
      categories: transformedCategories,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  },

  async getCategoriesForDropdown() {
    const query = `
      SELECT c.id_kategori, c.nama_kategori
      FROM categories c
      WHERE c.deleted_at IS NULL 
        AND c.nama_kategori IS NOT NULL 
        AND TRIM(c.nama_kategori) != ''
      ORDER BY c.nama_kategori ASC
    `;
    const categories = await prisma.$queryRawUnsafe(query);
    const validCategories = categories.filter(c => c.nama_kategori && c.nama_kategori.trim() !== '');
    return [
      { label: 'Semua Artikel', key: 'Semua Artikel' },
      ...validCategories.map(category => ({
        label: category.nama_kategori,
        key: category.nama_kategori,
        id: category.id_kategori
      }))
    ];
  },

  async getCategoryById(identifier) {
    let query, param;
    const isUUID = typeof identifier === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    if (isUUID) {
      query = `
        SELECT c.id_kategori, c.nama_kategori, c.created_at, c.updated_at,
          COALESCE(u.id, '') as author_id,
          COALESCE(u.name, 'System') as author_name,
          COALESCE(u.email, '') as author_email
        FROM categories c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.id_kategori = ? 
          AND c.deleted_at IS NULL
          AND c.nama_kategori IS NOT NULL 
          AND TRIM(c.nama_kategori) != ''
      `;
      param = identifier;
    } else {
      query = `
        SELECT c.id_kategori, c.nama_kategori, c.created_at, c.updated_at,
          COALESCE(u.id, '') as author_id,
          COALESCE(u.name, 'System') as author_name,
          COALESCE(u.email, '') as author_email
        FROM categories c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.nama_kategori = ? 
          AND c.deleted_at IS NULL
          AND c.nama_kategori IS NOT NULL 
          AND TRIM(c.nama_kategori) != ''
      `;
      param = identifier;
    }

    const rows = await prisma.$queryRawUnsafe(query, param);
    return this.transformCategoryForFrontend(rows[0] || null);
  },

  async getCategoriesWithArticleCount() {
    const query = `
      SELECT c.id_kategori, c.nama_kategori, c.created_at, c.updated_at,
        COALESCE(u.name, 'System') as author_name,
        COUNT(a.id) as total_articles,
        COUNT(CASE WHEN a.published_at IS NOT NULL THEN 1 END) as published_articles
      FROM categories c
      LEFT JOIN users u ON c.author_id = u.id
      LEFT JOIN articles a ON c.id_kategori = a.category_id
      WHERE c.deleted_at IS NULL
        AND c.nama_kategori IS NOT NULL 
        AND TRIM(c.nama_kategori) != ''
      GROUP BY c.id_kategori, c.nama_kategori, c.created_at, c.updated_at, u.name
      ORDER BY c.created_at DESC
    `;
    const categories = await prisma.$queryRawUnsafe(query);
    return categories.map(category => {
      const transformed = this.transformCategoryForFrontend(category);
      transformed.total_articles = Number(category.total_articles) || 0;
      transformed.published_articles = Number(category.published_articles) || 0;
      transformed.article_count = Number(category.published_articles) || 0;
      return transformed;
    });
  },

  async createCategory(categoryData) {
    const categoryName = categoryData.name || categoryData.nama_kategori;
    const authorId = categoryData.author_id;

    if (!categoryName || categoryName.trim() === '') {
      throw new HttpError('Category name is required and cannot be empty', 400);
    }
    if (!authorId) throw new HttpError('Author ID is required', 400);

    const trimmedName = categoryName.trim();
    if (trimmedName === '') {
      throw new HttpError('Category name cannot be just whitespace', 400);
    }

    const existing = await prisma.$queryRawUnsafe(
      'SELECT id_kategori FROM categories WHERE nama_kategori = ? AND deleted_at IS NULL',
      trimmedName
    );
    if (existing.length > 0) throw new HttpError('Category name already exists', 400);

    const categoryId = randomUUID();
    const insertQuery = `
      INSERT INTO categories (id_kategori, nama_kategori, author_id, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    await prisma.$executeRawUnsafe(insertQuery, categoryId, trimmedName, authorId);
    return await this.getCategoryById(categoryId);
  },

  async updateCategory(id, updateData) {
    const existingCategory = await this.getCategoryById(id);
    if (!existingCategory) throw new HttpError('Category not found', 404);

    const newCategoryName = updateData.name || updateData.nama_kategori;
    if (!newCategoryName || newCategoryName.trim() === '') {
      throw new HttpError('Category name cannot be empty', 400);
    }

    const trimmedName = newCategoryName.trim();
    const existing = await prisma.$queryRawUnsafe(
      'SELECT id_kategori FROM categories WHERE nama_kategori = ? AND id_kategori != ? AND deleted_at IS NULL',
      trimmedName, id
    );
    if (existing.length > 0) throw new HttpError('Category name already exists', 400);

    const updateQuery = `
      UPDATE categories 
      SET nama_kategori = ?, updated_at = NOW()
      WHERE id_kategori = ? AND deleted_at IS NULL
    `;
    await prisma.$executeRawUnsafe(updateQuery, trimmedName, id);
    return await this.getCategoryById(id);
  },

  async deleteCategory(id) {
    const existingCategory = await this.getCategoryById(id);
    if (!existingCategory) throw new HttpError('Category not found', 404);

    const articlesCount = await prisma.$queryRawUnsafe(
      'SELECT COUNT(*) as count FROM articles WHERE category_id = ? AND published_at IS NOT NULL AND deleted_at IS NULL',
      id
    );
    const articleCount = Number(articlesCount[0].count);

    if (articleCount > 0) {
      throw new HttpError(
        `Tidak dapat menghapus kategori yang masih memiliki ${articleCount} artikel published.`,
        400
      );
    }

    const deleteQuery = `DELETE FROM categories WHERE id_kategori = ?`;
    const result = await prisma.$executeRawUnsafe(deleteQuery, id);
    if (!result || (result.count !== undefined && result.count === 0)) {
      throw new HttpError('Category not found or already deleted', 404);
    }
    return { success: true, message: 'Category deleted successfully' };
  },

  async getArticleCountByCategory(categoryId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM articles 
      WHERE category_id = ? AND published_at IS NOT NULL
    `;
    const result = await prisma.$queryRawUnsafe(query, categoryId);
    return Number(result[0].count) || 0;
  }
};

export default categoryService;
