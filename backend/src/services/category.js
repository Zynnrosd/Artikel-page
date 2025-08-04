import { prisma } from '../utils/db.js';
import { HttpError } from '../utils/error.js';
import { randomUUID } from 'crypto';

const categoryService = {
  // Get all categories with pagination
  async getAllCategories(options = {}) {
    const {
      page = 1,
      limit = 10,
      search
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

    // ✅ PERUBAHAN: Query categories tanpa custom_author
    const categoriesQuery = `
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

    queryParams.push(limit, offset);
    const categories = await prisma.$queryRawUnsafe(categoriesQuery, ...queryParams);

    // ✅ PERUBAHAN: author_display hanya menggunakan author_name
    const categoriesWithAuthor = categories.map(category => ({
      ...category,
      author_display: category.author_name // Tidak ada custom_author lagi
    }));

    return {
      categories: categoriesWithAuthor,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  },

  // Get single category by ID
  async getCategoryById(id) {
    // ✅ PERUBAHAN: Query category tanpa custom_author
    const query = `
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

    const rows = await prisma.$queryRawUnsafe(query, id);
    const category = rows[0] || null;
    
    if (category) {
      // ✅ PERUBAHAN: author_display hanya menggunakan author_name
      category.author_display = category.author_name; // Tidak ada custom_author lagi
    }
    
    return category;
  },

  // Create new category
  async createCategory(categoryData) {
    const {
      nama_kategori,
      author_id
      // ✅ PERUBAHAN: custom_author dihapus dari parameter
    } = categoryData;

    // Check if category name already exists
    const existing = await prisma.$queryRawUnsafe(
      'SELECT id_kategori FROM categories WHERE nama_kategori = ? AND deleted_at IS NULL',
      nama_kategori
    );

    if (existing.length > 0) {
      throw new HttpError(400, { 
        message: 'Category name already exists',
        errors: null
      });
    }

    // Generate UUID for category ID
    const categoryId = randomUUID();

    // ✅ PERUBAHAN: Insert query tanpa custom_author
    const insertQuery = `
      INSERT INTO categories (
        id_kategori, nama_kategori, author_id, created_at, updated_at
      ) VALUES (?, ?, ?, NOW(), NOW())
    `;

    await prisma.$executeRawUnsafe(insertQuery, 
      categoryId,
      nama_kategori,
      author_id
      // custom_author dihapus dari parameter
    );

    return await this.getCategoryById(categoryId);
  },

  // Update category
  async updateCategory(id, updateData) {
    console.log('=== UPDATE CATEGORY SERVICE DEBUG ===');
    console.log('Category ID:', id);
    console.log('Update data received:', updateData);
    console.log('Update data keys:', Object.keys(updateData));
    
    // Check if category exists
    const existingCategory = await this.getCategoryById(id);
    if (!existingCategory) {
      throw new HttpError(404, { 
        message: 'Category not found',
        errors: null
      });
    }

    // ✅ PERUBAHAN: allowedFields hanya nama_kategori
    const allowedFields = ['nama_kategori']; // custom_author dihapus
    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      console.log(`Processing field: ${key} = ${updateData[key]} (type: ${typeof updateData[key]})`);
      
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        if (key === 'nama_kategori') {
          updateFields.push('nama_kategori = ?');
          updateValues.push(updateData[key]);
          console.log(`Added nama_kategori to update: ${updateData[key]}`);
        }
        // ✅ PERUBAHAN: custom_author handling dihapus
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
        updateData.nama_kategori, id
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
    // ✅ PERUBAHAN: Query tanpa custom_author
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
    
    // ✅ PERUBAHAN: author_display hanya menggunakan author_name
    return categories.map(category => ({
      ...category,
      author_display: category.author_name // Tidak ada custom_author lagi
    }));
  }
};

export default categoryService;