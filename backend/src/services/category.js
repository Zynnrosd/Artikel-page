import { prisma } from '../utils/db.js';
import { HttpError } from '../utils/error.js';
import { randomUUID } from 'crypto';

const categoryService = {
  // ✅ HELPER: Transform database row to frontend format
  transformCategoryForFrontend(category) {
    if (!category) return null;
    
    return {
      id: category.id_kategori,
      name: category.nama_kategori,
      label: category.nama_kategori, // For frontend dropdown compatibility
      key: category.nama_kategori,   // For frontend CategoryTabs compatibility
      createdAt: category.created_at,
      updatedAt: category.updated_at,
      author: category.author_name,
      // Keep original fields for admin use
      id_kategori: category.id_kategori,
      nama_kategori: category.nama_kategori,
      author_id: category.author_id,
      author_name: category.author_name,
      author_email: category.author_email,
      author_display: category.author_name
    };
  },

  // Get all categories with pagination
  async getAllCategories(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      includeArticleCount = false
    } = options;

    const offset = (page - 1) * limit;
    
    let whereConditions = ['c.deleted_at IS NULL'];
    let queryParams = [];

    // Add search condition
    if (search) {
      whereConditions.push(`c.nama_kategori LIKE ?`);
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count total items
    const countQuery = `
      SELECT COUNT(*) as total
      FROM categories c
      ${whereClause}
    `;

    const countResult = await prisma.$queryRawUnsafe(countQuery, ...queryParams);
    const totalItems = Number(countResult[0].total);
    const totalPages = Math.ceil(totalItems / limit);

    // Build categories query with optional article count
    let categoriesQuery;
    if (includeArticleCount) {
      categoriesQuery = `
        SELECT 
          c.id_kategori,
          c.nama_kategori,
          c.created_at,
          c.updated_at,
          u.id as author_id,
          u.name as author_name,
          u.email as author_email,
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
        SELECT 
          c.id_kategori,
          c.nama_kategori,
          c.created_at,
          c.updated_at,
          u.id as author_id,
          u.name as author_name,
          u.email as author_email
        FROM categories c
        LEFT JOIN users u ON c.author_id = u.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `;
    }

    queryParams.push(limit, offset);
    const categories = await prisma.$queryRawUnsafe(categoriesQuery, ...queryParams);

    // Transform categories for frontend
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

  // ✅ NEW: Get categories for frontend dropdown (simplified)
  async getCategoriesForDropdown() {
    const query = `
      SELECT 
        c.id_kategori,
        c.nama_kategori
      FROM categories c
      WHERE c.deleted_at IS NULL
      ORDER BY c.nama_kategori ASC
    `;

    const categories = await prisma.$queryRawUnsafe(query);
    
    // Format for frontend CategoryTabs component
    const formattedCategories = [
      { label: 'Semua Artikel', key: 'Semua Artikel' }, // Default "All" option
      ...categories.map(category => ({
        label: category.nama_kategori,
        key: category.nama_kategori,
        id: category.id_kategori
      }))
    ];

    return formattedCategories;
  },

  // Get single category by ID or name
  async getCategoryById(identifier) {
    let query, param;
    
    // Support both ID and name lookup
    if (typeof identifier === 'string' && isNaN(identifier)) {
      // Look up by name
      query = `
        SELECT 
          c.id_kategori,
          c.nama_kategori,
          c.created_at,
          c.updated_at,
          u.id as author_id,
          u.name as author_name,
          u.email as author_email
        FROM categories c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.nama_kategori = ? AND c.deleted_at IS NULL
      `;
      param = identifier;
    } else {
      // Look up by ID
      query = `
        SELECT 
          c.id_kategori,
          c.nama_kategori,
          c.created_at,
          c.updated_at,
          u.id as author_id,
          u.name as author_name,
          u.email as author_email
        FROM categories c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.id_kategori = ? AND c.deleted_at IS NULL
      `;
      param = identifier;
    }

    const rows = await prisma.$queryRawUnsafe(query, param);
    const category = rows[0] || null;
    
    return this.transformCategoryForFrontend(category);
  },

  // Create new category
  async createCategory(categoryData) {
    const {
      nama_kategori,
      author_id
    } = categoryData;

    // Validate required fields
    if (!nama_kategori || nama_kategori.trim() === '') {
      throw new HttpError(400, { 
        message: 'Category name is required',
        errors: null
      });
    }

    // Check if category name already exists
    const existing = await prisma.$queryRawUnsafe(
      'SELECT id_kategori FROM categories WHERE nama_kategori = ? AND deleted_at IS NULL',
      nama_kategori.trim()
    );

    if (existing.length > 0) {
      throw new HttpError(400, { 
        message: 'Category name already exists',
        errors: null
      });
    }

    // Generate UUID for category ID
    const categoryId = randomUUID();

    const insertQuery = `
      INSERT INTO categories (
        id_kategori, nama_kategori, author_id, created_at, updated_at
      ) VALUES (?, ?, ?, NOW(), NOW())
    `;

    await prisma.$executeRawUnsafe(insertQuery, 
      categoryId,
      nama_kategori.trim(),
      author_id
    );

    return await this.getCategoryById(categoryId);
  },

  // Update category
  async updateCategory(id, updateData) {
    console.log('=== UPDATE CATEGORY SERVICE DEBUG ===');
    console.log('Category ID:', id);
    console.log('Update data received:', updateData);
    
    // Check if category exists
    const existingCategory = await this.getCategoryById(id);
    if (!existingCategory) {
      throw new HttpError(404, { 
        message: 'Category not found',
        errors: null
      });
    }

    const allowedFields = ['nama_kategori'];
    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      console.log(`Processing field: ${key} = ${updateData[key]}`);
      
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        if (key === 'nama_kategori') {
          if (!updateData[key] || updateData[key].trim() === '') {
            throw new HttpError(400, { 
              message: 'Category name cannot be empty',
              errors: null
            });
          }
          updateFields.push('nama_kategori = ?');
          updateValues.push(updateData[key].trim());
          console.log(`Added nama_kategori to update: ${updateData[key].trim()}`);
        }
      } else {
        console.log(`Field ${key} skipped - not allowed or undefined`);
      }
    });

    console.log('Update fields:', updateFields);
    console.log('Update values:', updateValues);

    if (updateFields.length === 0) {
      throw new HttpError(400, { 
        message: 'No valid fields to update',
        errors: null
      });
    }

    // Check for duplicate name if nama_kategori is being updated
    if (updateData.nama_kategori) {
      const existing = await prisma.$queryRawUnsafe(
        'SELECT id_kategori FROM categories WHERE nama_kategori = ? AND id_kategori != ? AND deleted_at IS NULL',
        updateData.nama_kategori.trim(), id
      );

      if (existing.length > 0) {
        throw new HttpError(400, { 
          message: 'Category name already exists',
          errors: null
        });
      }
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    const updateQuery = `
      UPDATE categories 
      SET ${updateFields.join(', ')} 
      WHERE id_kategori = ? AND deleted_at IS NULL
    `;

    console.log('Final update query:', updateQuery);
    console.log('Final update values:', updateValues);

    await prisma.$executeRawUnsafe(updateQuery, ...updateValues);

    return await this.getCategoryById(id);
  },

  // Soft delete category
  async deleteCategory(id) {
    const existingCategory = await this.getCategoryById(id);
    if (!existingCategory) {
      throw new HttpError(404, { 
        message: 'Category not found',
        errors: null
      });
    }

    // Check if category has published articles
    const articlesCount = await prisma.$queryRawUnsafe(
      'SELECT COUNT(*) as count FROM articles WHERE category_id = ? AND published_at IS NOT NULL',
      id
    );

    if (Number(articlesCount[0].count) > 0) {
      throw new HttpError(400, { 
        message: 'Cannot delete category that has published articles. Please unpublish or reassign the articles first.',
        errors: null
      });
    }

    const deleteQuery = `
      UPDATE categories 
      SET deleted_at = NOW() 
      WHERE id_kategori = ? AND deleted_at IS NULL
    `;

    const result = await prisma.$executeRawUnsafe(deleteQuery, id);
    
    if (result.count === 0) {
      throw new HttpError(404, { 
        message: 'Category not found or already deleted',
        errors: null
      });
    }

    return true;
  },

  // Get categories with article count
  async getCategoriesWithArticleCount() {
    const query = `
      SELECT 
        c.id_kategori,
        c.nama_kategori,
        c.created_at,
        c.updated_at,
        u.name as author_name,
        COUNT(a.id) as total_articles,
        COUNT(CASE WHEN a.published_at IS NOT NULL THEN 1 END) as published_articles
      FROM categories c
      LEFT JOIN users u ON c.author_id = u.id
      LEFT JOIN articles a ON c.id_kategori = a.category_id
      WHERE c.deleted_at IS NULL
      GROUP BY c.id_kategori, c.nama_kategori, c.created_at, c.updated_at, u.name
      ORDER BY c.created_at DESC
    `;

    const categories = await prisma.$queryRawUnsafe(query);
    
    return categories.map(category => {
      const transformed = this.transformCategoryForFrontend(category);
      transformed.total_articles = Number(category.total_articles) || 0;
      transformed.published_articles = Number(category.published_articles) || 0;
      return transformed;
    });
  }
};

export default categoryService;