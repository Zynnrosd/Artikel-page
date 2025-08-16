import { prisma } from '../utils/db.js';
import { HttpError } from '../utils/error.js';
import { generateSlug } from '../utils/helper.js';
import { randomUUID } from 'crypto';

const articleService = {
  // Helper function untuk extract preview dari content
  extractPreview(content, maxLength = 150) {
    if (!content) return '';
    
    // Remove HTML tags jika ada
    const textOnly = content.replace(/<[^>]*>/g, '');
    
    if (textOnly.length <= maxLength) {
      return textOnly;
    }
    
    // Potong di kata terakhir yang pas
    const truncated = textOnly.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    return lastSpaceIndex > 0 
      ? truncated.substring(0, lastSpaceIndex) + '...'
      : truncated + '...';
  },

  // ✅ HELPER: Transform database row to frontend format
  transformArticleForFrontend(article) {
    if (!article) return null;
    
    return {
      id: article.id,
      title: article.title,
      description: this.extractPreview(article.content), // Frontend expects 'description'
      content: article.content,
      image: article.featured_image, // Frontend expects 'image'
      mainImage: article.featured_image, // Also provide mainImage for detail view
      author: article.custom_author || article.author_name, // Frontend expects 'author'
      category: article.category_name, // Frontend expects 'category'
      createdAt: article.created_at, // Frontend expects 'createdAt'
      updatedAt: article.updated_at,
      published_at: article.published_at,
      is_published: article.published_at !== null,
      status: article.published_at !== null ? 'published' : 'draft', // For admin table
      slug: article.slug,
      // Keep original fields for admin use
      category_id: article.category_id,
      author_id: article.author_id,
      custom_author: article.custom_author,
      featured_image: article.featured_image
    };
  },

  // Get all articles with filters, pagination, and publish status
  async getAllArticles(options = {}) {
    const {
      page = 1,
      limit = 10,
      category,
      author,
      search,
      published = null // null = all, true = published only, false = unpublished only
    } = options;

    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let queryParams = [];

    // Add search condition
    if (search) {
      whereConditions.push(`(a.title LIKE ? OR a.content LIKE ? OR a.custom_author LIKE ?)`);
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Add category filter - support both category name and ID
    if (category) {
      if (typeof category === 'string' && isNaN(category)) {
        // Filter by category name (for frontend compatibility)
        whereConditions.push(`c.nama_kategori = ?`);
        queryParams.push(category);
      } else {
        // Filter by category ID
        whereConditions.push(`c.id_kategori = ?`);
        queryParams.push(category);
      }
    }

    // Add author filter - support both author name and ID
    if (author) {
      if (typeof author === 'string' && isNaN(author)) {
        // Filter by custom author name (for frontend compatibility)
        whereConditions.push(`a.custom_author = ?`);
        queryParams.push(author);
      } else {
        // Filter by author ID
        whereConditions.push(`u.id = ?`);
        queryParams.push(author);
      }
    }

    // Add published filter
    if (published === true) {
      whereConditions.push(`a.published_at IS NOT NULL`);
    } else if (published === false) {
      whereConditions.push(`a.published_at IS NULL`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count total items
    const countQuery = `
      SELECT COUNT(*) as total
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id_kategori
      LEFT JOIN users u ON a.author_id = u.id
      ${whereClause}
    `;

    const countResult = await prisma.$queryRawUnsafe(countQuery, ...queryParams);
    const totalItems = Number(countResult[0].total);
    const totalPages = Math.ceil(totalItems / limit);

    // Get articles with pagination
    const articlesQuery = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.content,
        a.featured_image,
        a.published_at,
        a.created_at,
        a.updated_at,
        c.id_kategori as category_id,
        c.nama_kategori as category_name,
        u.id as author_id,
        u.name as author_name,
        u.email as author_email,
        a.custom_author
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id_kategori
      LEFT JOIN users u ON a.author_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    const articles = await prisma.$queryRawUnsafe(articlesQuery, ...queryParams);

    // Transform articles for frontend
    const transformedArticles = articles.map(article => this.transformArticleForFrontend(article));

    return {
      articles: transformedArticles,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  },

  // Get single article by ID or slug
  async getArticleById(identifier) {
    const query = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.content,
        a.featured_image,
        a.published_at,
        a.created_at,
        a.updated_at,
        c.id_kategori as category_id,
        c.nama_kategori as category_name,
        u.id as author_id,
        u.name as author_name,
        u.email as author_email,
        a.custom_author
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id_kategori
      LEFT JOIN users u ON a.author_id = u.id
      WHERE (a.id = ? OR a.slug = ?)
    `;

    const rows = await prisma.$queryRawUnsafe(query, identifier, identifier);
    const article = rows[0] || null;
    
    return this.transformArticleForFrontend(article);
  },

  // ✅ NEW: Get related articles by category
  async getRelatedArticles(articleId, categoryId, limit = 5) {
    const query = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.content,
        a.featured_image,
        a.published_at,
        a.created_at,
        a.updated_at,
        c.id_kategori as category_id,
        c.nama_kategori as category_name,
        u.id as author_id,
        u.name as author_name,
        a.custom_author
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id_kategori
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.category_id = ? 
        AND a.id != ? 
        AND a.published_at IS NOT NULL
      ORDER BY a.created_at DESC
      LIMIT ?
    `;

    const articles = await prisma.$queryRawUnsafe(query, categoryId, articleId, limit);
    return articles.map(article => this.transformArticleForFrontend(article));
  },

  // ✅ NEW: Get unique authors for filter dropdown
  async getUniqueAuthors() {
    const query = `
      SELECT DISTINCT a.custom_author as name
      FROM articles a
      WHERE a.custom_author IS NOT NULL
        AND a.published_at IS NOT NULL
      ORDER BY a.custom_author ASC
    `;

    const result = await prisma.$queryRawUnsafe(query);
    return result.map(row => row.name);
  },

  // ✅ NEW: Get unique categories for filter dropdown
  async getUniqueCategories() {
    const query = `
      SELECT DISTINCT c.nama_kategori as name, c.id_kategori as id
      FROM categories c
      INNER JOIN articles a ON c.id_kategori = a.category_id
      WHERE a.published_at IS NOT NULL
        AND c.deleted_at IS NULL
      ORDER BY c.nama_kategori ASC
    `;

    const result = await prisma.$queryRawUnsafe(query);
    return result.map(row => ({ 
      label: row.name, 
      key: row.name,
      id: row.id 
    }));
  },

  // Create new article
  async createArticle(articleData) {
    const {
      title,
      content,
      category_id,
      author_id,
      featured_image,
      custom_author, // ✅ WAJIB ada (NOT NULL)
      is_published = false
    } = articleData;

    // ✅ VALIDASI: Pastikan custom_author tidak kosong
    if (!custom_author || custom_author.trim() === '') {
      throw new HttpError(400, {
        message: 'Author name is required',
        errors: null
      });
    }

    // Generate unique slug
    let slug = generateSlug(title);
    let slugExists = true;
    let counter = 1;
    let finalSlug = slug;

    while (slugExists) {
      const existing = await prisma.$queryRawUnsafe(
        'SELECT id FROM articles WHERE slug = ?',
        finalSlug
      );
      
      if (existing.length === 0) {
        slugExists = false;
      } else {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
    }

    // Verify category exists
    const categoryExists = await prisma.$queryRawUnsafe(
      'SELECT id_kategori FROM categories WHERE id_kategori = ?',
      category_id
    );

    if (categoryExists.length === 0) {
      throw new HttpError(404, {
        message: 'Category not found',
        errors: null
      });
    }

    // Generate UUID for article ID
    const articleId = randomUUID();

    const insertQuery = `
      INSERT INTO articles (
        id, title, slug, content, featured_image, 
        author_id, custom_author, category_id, published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await prisma.$executeRawUnsafe(insertQuery,
      articleId,
      title,
      finalSlug,
      content,
      featured_image || null,
      author_id,
      custom_author,
      category_id,
      is_published ? new Date() : null
    );

    return await this.getArticleById(articleId);
  },

  // Update article
  async updateArticle(id, updateData) {
    // Check if article exists
    const existingArticle = await this.getArticleById(id);
    if (!existingArticle) {
      throw new HttpError(404, {
        message: 'Article not found',
        errors: null
      });
    }

    const allowedFields = [
      'title', 'content', 'category_id', 'featured_image', 'custom_author', 'is_published'
    ];
    
    const updateFields = [];
    const updateValues = [];

    for (const key of Object.keys(updateData)) {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        if (key === 'title') {
          // Update slug if title changes
          const newSlug = generateSlug(updateData[key]);
          
          // Check if new slug already exists (excluding current article)
          const existingSlug = await prisma.$queryRawUnsafe(
            'SELECT id FROM articles WHERE slug = ? AND id != ?',
            newSlug, id
          );
          
          let finalSlug = newSlug;
          if (existingSlug.length > 0) {
            let counter = 1;
            let slugExists = true;
            while (slugExists) {
              const testSlug = `${newSlug}-${counter}`;
              const slugCheck = await prisma.$queryRawUnsafe(
                'SELECT id FROM articles WHERE slug = ? AND id != ?',
                testSlug, id
              );
              if (slugCheck.length === 0) {
                finalSlug = testSlug;
                slugExists = false;
              } else {
                counter++;
              }
            }
          }
          
          updateFields.push('title = ?', 'slug = ?');
          updateValues.push(updateData[key], finalSlug);
        } else if (key === 'category_id') {
          // Verify category exists
          const categoryExists = await prisma.$queryRawUnsafe(
            'SELECT id_kategori FROM categories WHERE id_kategori = ?',
            updateData[key]
          );
          
          if (categoryExists.length === 0) {
            throw new HttpError(404, {
              message: 'Category not found',
              errors: null
            });
          }
          
          updateFields.push('category_id = ?');
          updateValues.push(updateData[key]);
        } else if (key === 'custom_author') {
          // ✅ VALIDASI: Pastikan custom_author tidak kosong saat update
          if (!updateData[key] || updateData[key].trim() === '') {
            throw new HttpError(400, {
              message: 'Author name cannot be empty',
              errors: null
            });
          }
          updateFields.push(`${key} = ?`);
          updateValues.push(updateData[key]);
        } else if (key === 'is_published') {
          // Handle publish/unpublish
          const publishedAt = updateData[key] ? new Date() : null;
          updateFields.push('published_at = ?');
          updateValues.push(publishedAt);
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(updateData[key]);
        }
      }
    }

    if (updateFields.length === 0) {
      throw new HttpError(400, {
        message: 'No valid fields to update',
        errors: null
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    const updateQuery = `
      UPDATE articles 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;

    await prisma.$executeRawUnsafe(updateQuery, ...updateValues);

    return await this.getArticleById(id);
  },

  // Toggle publish status
  async togglePublishStatus(id) {
    const article = await this.getArticleById(id);
    if (!article) {
      throw new HttpError(404, {
        message: 'Article not found',
        errors: null
      });
    }

    const newPublishStatus = !article.is_published;
    const publishedAt = newPublishStatus ? new Date() : null;

    await prisma.$executeRawUnsafe(
      'UPDATE articles SET published_at = ?, updated_at = NOW() WHERE id = ?',
      publishedAt, id
    );

    return await this.getArticleById(id);
  },

  // Delete article (hard delete)
  async deleteArticle(id) {
    const existingArticle = await this.getArticleById(id);
    if (!existingArticle) {
      throw new HttpError(404, {
        message: 'Article not found',
        errors: null
      });
    }

    const deleteQuery = `DELETE FROM articles WHERE id = ?`;

    const result = await prisma.$executeRawUnsafe(deleteQuery, id);
    
    if (result.count === 0) {
      throw new HttpError(404, {
        message: 'Article not found or already deleted',
        errors: null
      });
    }

    return true;
  },

  // Get articles by category
  async getArticlesByCategory(categoryIdentifier, options = {}) {
    const { page = 1, limit = 10, published = true } = options;
    
    // Support both category name and ID
    let categoryCondition, categoryParam;
    if (typeof categoryIdentifier === 'string' && isNaN(categoryIdentifier)) {
      categoryCondition = 'c.nama_kategori = ?';
      categoryParam = categoryIdentifier;
    } else {
      categoryCondition = 'c.id_kategori = ?';
      categoryParam = categoryIdentifier;
    }

    const offset = (page - 1) * limit;

    // Verify category exists
    const categoryExists = await prisma.$queryRawUnsafe(
      `SELECT id_kategori FROM categories WHERE ${categoryCondition}`,
      categoryParam
    );

    if (categoryExists.length === 0) {
      throw new HttpError(404, {
        message: 'Category not found',
        errors: null
      });
    }

    let whereClause = `WHERE ${categoryCondition}`;
    let queryParams = [categoryParam];

    // Add published filter if specified
    if (published === true) {
      whereClause += ' AND a.published_at IS NOT NULL';
    } else if (published === false) {
      whereClause += ' AND a.published_at IS NULL';
    }

    // Count total items
    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total FROM articles a 
       LEFT JOIN categories c ON a.category_id = c.id_kategori 
       ${whereClause}`,
      ...queryParams
    );
    const totalItems = Number(countResult[0].total);
    const totalPages = Math.ceil(totalItems / limit);

    // Get articles
    const articlesQuery = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.content,
        a.featured_image,
        a.published_at,
        a.created_at,
        a.updated_at,
        c.id_kategori as category_id,
        c.nama_kategori as category_name,
        u.id as author_id,
        u.name as author_name,
        a.custom_author
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id_kategori
      LEFT JOIN users u ON a.author_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    const articles = await prisma.$queryRawUnsafe(articlesQuery, ...queryParams);

    // Transform articles for frontend
    const transformedArticles = articles.map(article => this.transformArticleForFrontend(article));

    return {
      articles: transformedArticles,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  },

  // Get published articles for public view
  async getPublishedArticles(options = {}) {
    return await this.getAllArticles({
      ...options,
      published: true
    });
  }
};

export default articleService;