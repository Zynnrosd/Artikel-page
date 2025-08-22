import { prisma } from '../utils/db.js';
import { HttpError } from '../utils/error.js';
import { generateSlug } from '../utils/helper.js';
import { randomUUID } from 'crypto';
import { moveFileFromTemp } from '../middlewares/upload.js';

const articleService = {
  extractPreview(content, maxLength = 150) {
    if (!content) return '';
    const textOnly = content.replace(/<[^>]*>/g, '');
    if (textOnly.length <= maxLength) return textOnly;
    const truncated = textOnly.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    return lastSpaceIndex > 0
      ? truncated.substring(0, lastSpaceIndex) + '...'
      : truncated + '...';
  },

  transformArticleForFrontend(article) {
    if (!article) return null;
    const displayAuthor = article.author_name || article.custom_author;

    return {
      id: article.id,
      title: article.title,
      description: this.extractPreview(article.content),
      content: article.content,
      image: article.featured_image,
      mainImage: article.featured_image,
      author: displayAuthor,
      category: article.category_name,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
      published_at: article.published_at,
      is_published: article.published_at !== null,
      status: article.published_at !== null ? 'published' : 'draft',
      slug: article.slug,
      category_id: article.category_id,
      custom_author: article.custom_author,
      featured_image: article.featured_image
    };
  },

  async validateCategory(categoryIdentifier) {
    if (!categoryIdentifier || categoryIdentifier.trim() === '') {
      return { isValid: false, error: 'Category identifier is required', categoryId: null };
    }

    const identifier = categoryIdentifier.trim();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    let query, param;
    if (isUUID) {
      query = 'SELECT id_kategori FROM categories WHERE id_kategori = ? AND deleted_at IS NULL';
      param = identifier;
    } else {
      query = 'SELECT id_kategori FROM categories WHERE nama_kategori = ? AND deleted_at IS NULL';
      param = identifier;
    }

    try {
      const result = await prisma.$queryRawUnsafe(query, param);
      if (result.length === 0) {
        return { isValid: false, error: `Category '${identifier}' not found`, categoryId: null };
      }
      const categoryId = result[0].id_kategori;
      return { isValid: true, error: null, categoryId };
    } catch {
      return { isValid: false, error: 'Error validating category', categoryId: null };
    }
  },

  async createOrGetAuthor(authorName, createdByUserId) {
    if (!authorName || authorName.trim() === '') {
      throw new HttpError('Author name is required', 400);
    }

    const trimmedName = authorName.trim();

    const existingAuthor = await prisma.$queryRawUnsafe(
      'SELECT id, name FROM authors WHERE name = ? AND deleted_at IS NULL',
      trimmedName
    );

    if (existingAuthor.length > 0) {
      return existingAuthor[0].id;
    }

    const authorId = randomUUID();
    const insertQuery = `
      INSERT INTO authors (id, name, created_by, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;

    try {
      await prisma.$executeRawUnsafe(insertQuery, authorId, trimmedName, createdByUserId);
      return authorId;
    } catch (error) {
      throw new HttpError('Failed to create author: ' + error.message, 500);
    }
  },

  async getAllArticles(options = {}) {
    const {
      page = 1,
      limit = 10,
      category,
      author,
      search,
      published = null
    } = options;

    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];

    if (search) {
      whereConditions.push(`(a.title LIKE ? OR a.content LIKE ? OR au.name LIKE ?)`);
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      if (typeof category === 'string' && isNaN(category)) {
        whereConditions.push(`c.nama_kategori = ?`);
        queryParams.push(category);
      } else {
        whereConditions.push(`c.id_kategori = ?`);
        queryParams.push(category);
      }
    }

    if (author) {
      if (typeof author === 'string' && isNaN(author)) {
        whereConditions.push(`au.name = ?`);
        queryParams.push(author);
      } else {
        whereConditions.push(`au.id = ?`);
        queryParams.push(author);
      }
    }

    if (published === true) {
      whereConditions.push(`a.published_at IS NOT NULL`);
    } else if (published === false) {
      whereConditions.push(`a.published_at IS NULL`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id_kategori
      LEFT JOIN authors au ON a.author_id = au.id
      ${whereClause}
    `;

    const countResult = await prisma.$queryRawUnsafe(countQuery, ...queryParams);
    const totalItems = Number(countResult[0].total);
    const totalPages = Math.ceil(totalItems / limit);

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
        au.name as author_name,
        a.custom_author
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id_kategori
      LEFT JOIN authors au ON a.author_id = au.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    const articles = await prisma.$queryRawUnsafe(articlesQuery, ...queryParams);

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

  async getArticleById(identifier) {
    if (!identifier || identifier.trim() === '') {
      return null;
    }

    const cleanIdentifier = identifier.trim();

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
        au.name as author_name,
        a.custom_author
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id_kategori
      LEFT JOIN authors au ON a.author_id = au.id
      WHERE (a.id = ? OR a.slug = ?)
    `;

    try {
      const rows = await prisma.$queryRawUnsafe(query, cleanIdentifier, cleanIdentifier);
      const article = rows[0] || null;
      return this.transformArticleForFrontend(article);
    } catch {
      throw new HttpError('Error retrieving article', 500);
    }
  },

  async isValidPublishedArticle(identifier) {
    if (!identifier || identifier.trim() === '') {
      return false;
    }

    const cleanIdentifier = identifier.trim();

    const query = `
      SELECT a.id, a.slug, a.title, a.published_at
      FROM articles a
      WHERE (a.id = ? OR a.slug = ?) AND a.published_at IS NOT NULL
    `;

    try {
      const rows = await prisma.$queryRawUnsafe(query, cleanIdentifier, cleanIdentifier);
      return rows.length > 0;
    } catch {
      return false;
    }
  },

  async getRelatedArticles(articleId, categoryId, limit = null) {
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
        au.name as author_name,
        a.custom_author
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id_kategori
      LEFT JOIN authors au ON a.author_id = au.id
      WHERE a.category_id = ? 
        AND a.id != ? 
        AND a.published_at IS NOT NULL
      ORDER BY a.created_at DESC
      ${limit ? 'LIMIT ?' : ''}
    `;

    let queryParams = [categoryId, articleId];
    if (limit) queryParams.push(limit);

    const articles = await prisma.$queryRawUnsafe(query, ...queryParams);
    return articles.map(article => this.transformArticleForFrontend(article));
  },

  async getUniqueAuthors() {
    const query = `
      SELECT DISTINCT au.name
      FROM authors au
      INNER JOIN articles a ON au.id = a.author_id
      WHERE a.published_at IS NOT NULL
        AND au.deleted_at IS NULL
      ORDER BY au.name ASC
    `;
    const result = await prisma.$queryRawUnsafe(query);
    return result.map(row => row.name);
  },

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
    return result.map(row => ({ label: row.name, key: row.name, id: row.id }));
  },

  async generateUniqueSlug(title, excludeId = null) {
    let baseSlug = generateSlug(title);
    let finalSlug = baseSlug;
    let counter = 1;

    while (true) {
      let query = 'SELECT id FROM articles WHERE slug = ?';
      let params = [finalSlug];

      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }

      const existing = await prisma.$queryRawUnsafe(query, ...params);
      if (existing.length === 0) return finalSlug;

      finalSlug = `${baseSlug}-${counter}`;
      counter++;
      if (counter > 1000) {
        throw new HttpError('Unable to generate unique slug', 500);
      }
    }
  },

  async createArticle(articleData) {
    const {
      title,
      content,
      category_id,
      featured_image,
      author_name,
      created_by_user_id,
      is_published = false
    } = articleData;

    if (!author_name || author_name.trim() === '') {
      throw new HttpError('Author name is required', 400);
    }
    if (!category_id || category_id.trim() === '') {
      throw new HttpError('Category ID is required', 400);
    }
    if (!created_by_user_id) {
      throw new HttpError('Created by user ID is required', 400);
    }

    let finalImagePath = null;
    if (featured_image) {
      finalImagePath = moveFileFromTemp(featured_image);
      if (!finalImagePath) {
        throw new HttpError('Failed to process uploaded image', 500);
      }
    }

    const slug = await this.generateUniqueSlug(title);

    const categoryExists = await prisma.$queryRawUnsafe(
      'SELECT id_kategori, nama_kategori FROM categories WHERE id_kategori = ? AND deleted_at IS NULL',
      category_id
    );
    if (categoryExists.length === 0) {
      throw new HttpError(`Category with ID '${category_id}' not found or has been deleted`, 404);
    }

    const authorId = await this.createOrGetAuthor(author_name, created_by_user_id);
    const articleId = randomUUID();

    const insertQuery = `
      INSERT INTO articles (
        id, title, slug, content, featured_image, 
        author_id, custom_author, category_id, published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    try {
      await prisma.$executeRawUnsafe(
        insertQuery,
        articleId,
        title,
        slug,
        content,
        finalImagePath,
        authorId,
        author_name,
        category_id,
        is_published ? new Date() : null
      );
      return await this.getArticleById(articleId);
    } catch (error) {
      throw new HttpError('Failed to create article: ' + error.message, 500);
    }
  },

  async updateArticle(id, updateData) {
    const existingArticle = await this.getArticleById(id);
    if (!existingArticle) {
      throw new HttpError('Article not found', 404);
    }

    const allowedFields = [
      'title', 'content', 'category_id', 'featured_image', 'author_name', 'is_published'
    ];

    const updateFields = [];
    const updateValues = [];

    if (updateData.featured_image) {
      const finalImagePath = moveFileFromTemp(updateData.featured_image);
      if (!finalImagePath) {
        throw new HttpError('Failed to process uploaded image', 500);
      }
      updateData.featured_image = finalImagePath;
    }

    for (const key of Object.keys(updateData)) {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        if (key === 'title') {
          const newSlug = await this.generateUniqueSlug(updateData[key], id);
          updateFields.push('title = ?', 'slug = ?');
          updateValues.push(updateData[key], newSlug);
        } else if (key === 'category_id') {
          const categoryExists = await prisma.$queryRawUnsafe(
            'SELECT id_kategori FROM categories WHERE id_kategori = ?',
            updateData[key]
          );
          if (categoryExists.length === 0) {
            throw new HttpError('Category not found', 404);
          }
          updateFields.push('category_id = ?');
          updateValues.push(updateData[key]);
        } else if (key === 'author_name') {
          if (!updateData[key] || updateData[key].trim() === '') {
            throw new HttpError('Author name cannot be empty', 400);
          }
          const currentUser = updateData.created_by_user_id || existingArticle.created_by_user_id;
          if (!currentUser) {
            throw new HttpError('Unable to determine current user for author creation', 400);
          }
          const authorId = await this.createOrGetAuthor(updateData[key], currentUser);
          updateFields.push('author_id = ?', 'custom_author = ?');
          updateValues.push(authorId, updateData[key]);
        } else if (key === 'is_published') {
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
      throw new HttpError('No valid fields to update', 400);
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    const updateQuery = `
      UPDATE articles 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;

    await prisma.$executeRawUnsafe(updateQuery, ...updateValues);

    const updatedArticle = await this.getArticleById(id);
    return updatedArticle;
  },

  async togglePublishStatus(id) {
    const article = await this.getArticleById(id);
    if (!article) {
      throw new HttpError('Article not found', 404);
    }

    const newPublishStatus = !article.is_published;
    const publishedAt = newPublishStatus ? new Date() : null;

    await prisma.$executeRawUnsafe(
      'UPDATE articles SET published_at = ?, updated_at = NOW() WHERE id = ?',
      publishedAt, id
    );

    return await this.getArticleById(id);
  },

  async deleteArticle(id) {
    const existingArticle = await this.getArticleById(id);
    if (!existingArticle) {
      throw new HttpError('Article not found', 404);
    }

    const deleteQuery = `DELETE FROM articles WHERE id = ?`;
    const result = await prisma.$executeRawUnsafe(deleteQuery, id);

    if (result.count === 0) {
      throw new HttpError('Article not found or already deleted', 404);
    }

    return true;
  },

  async getArticlesByCategory(categoryIdentifier, options = {}) {
    const { page = 1, limit = 10, published = true } = options;

    let categoryCondition, categoryParam;
    if (typeof categoryIdentifier === 'string' && isNaN(categoryIdentifier)) {
      categoryCondition = 'c.nama_kategori = ?';
      categoryParam = categoryIdentifier;
    } else {
      categoryCondition = 'c.id_kategori = ?';
      categoryParam = categoryIdentifier;
    }

    const offset = (page - 1) * limit;

    const categoryExists = await prisma.$queryRawUnsafe(
      `SELECT id_kategori FROM categories WHERE ${categoryCondition}`,
      categoryParam
    );
    if (categoryExists.length === 0) {
      throw new HttpError('Category not found', 404);
    }

    let whereClause = `WHERE ${categoryCondition}`;
    let queryParams = [categoryParam];

    if (published === true) {
      whereClause += ' AND a.published_at IS NOT NULL';
    } else if (published === false) {
      whereClause += ' AND a.published_at IS NULL';
    }

    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total FROM articles a 
       LEFT JOIN categories c ON a.category_id = c.id_kategori 
       ${whereClause}`,
      ...queryParams
    );
    const totalItems = Number(countResult[0].total);
    const totalPages = Math.ceil(totalItems / limit);

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
        au.name as author_name,
        a.custom_author
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id_kategori
      LEFT JOIN authors au ON a.author_id = au.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    const articles = await prisma.$queryRawUnsafe(articlesQuery, ...queryParams);
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

  async getPublishedArticles(options = {}) {
    return await this.getAllArticles({ ...options, published: true });
  }
};

export default articleService;
