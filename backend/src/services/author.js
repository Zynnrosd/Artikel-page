// services/author.js
import { prisma } from '../utils/db.js';
import { HttpError } from '../utils/error.js';
import { randomUUID } from 'crypto';

const authorService = {
  transformAuthorForFrontend(author) {
    if (!author) return null;
    return {
      id: author.id,
      name: author.name || 'Unknown Author',
      label: author.name || 'Unknown Author',
      key: author.name || 'Unknown Author',
      createdBy: author.created_by,
      createdAt: author.created_at,
      updatedAt: author.updated_at,
      editing: false,
      author_id: author.id,
      author_name: author.name,
      created_by: author.created_by,
      author_display: author.name || 'Unknown Author'
    };
  },

  async getAllAuthors(options = {}) {
    const { page = 1, limit = 50, search, includeArticleCount = false } = options;
    const offset = (page - 1) * limit;

    let whereConditions = ['a.deleted_at IS NULL'];
    let queryParams = [];
    if (search) {
      whereConditions.push(`a.name LIKE ?`);
      queryParams.push(`%${search}%`);
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM authors a ${whereClause}`;
    const countResult = await prisma.$queryRawUnsafe(countQuery, ...queryParams);
    const totalItems = Number(countResult[0].total);
    const totalPages = Math.ceil(totalItems / limit);

    let authorsQuery;
    if (includeArticleCount) {
      authorsQuery = `
        SELECT a.id, a.name, a.created_at, a.updated_at, a.created_by,
          COALESCE(u.name, 'System') as creator_name,
          COALESCE(u.email, '') as creator_email,
          COUNT(ar.id) as total_articles,
          COUNT(CASE WHEN ar.published_at IS NOT NULL THEN 1 END) as published_articles
        FROM authors a
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN articles ar ON a.id = ar.author_id AND ar.deleted_at IS NULL
        ${whereClause}
        GROUP BY a.id, a.name, a.created_at, a.updated_at, a.created_by, u.name, u.email
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `;
    } else {
      authorsQuery = `
        SELECT a.id, a.name, a.created_at, a.updated_at, a.created_by,
          COALESCE(u.name, 'System') as creator_name,
          COALESCE(u.email, '') as creator_email
        FROM authors a
        LEFT JOIN users u ON a.created_by = u.id
        ${whereClause}
        ORDER BY a.name ASC
        LIMIT ? OFFSET ?
      `;
    }

    queryParams.push(limit, offset);
    const authors = await prisma.$queryRawUnsafe(authorsQuery, ...queryParams);

    const transformedAuthors = authors.map(author => {
      const transformed = this.transformAuthorForFrontend(author);
      if (includeArticleCount) {
        transformed.total_articles = Number(author.total_articles) || 0;
        transformed.published_articles = Number(author.published_articles) || 0;
      }
      return transformed;
    });

    return {
      authors: transformedAuthors,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  },

  async getAuthorsForDropdown() {
    const query = `
      SELECT a.id, a.name
      FROM authors a
      WHERE a.deleted_at IS NULL
        AND a.name IS NOT NULL 
        AND TRIM(a.name) != ''
      ORDER BY a.name ASC
    `;
    const authors = await prisma.$queryRawUnsafe(query);
    const validAuthors = authors.filter(a => a.name && a.name.trim() !== '');
    return validAuthors.map(author => ({
      label: author.name.trim(),
      key: author.name.trim(),
      id: author.id,
      name: author.name.trim()
    }));
  },

  async getAuthorById(identifier) {
    let query, param;
    const isUUID = typeof identifier === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    if (isUUID) {
      query = `
        SELECT a.id, a.name, a.created_at, a.updated_at, a.created_by,
          COALESCE(u.name, 'System') as creator_name,
          COALESCE(u.email, '') as creator_email
        FROM authors a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.id = ? AND a.deleted_at IS NULL
          AND a.name IS NOT NULL AND TRIM(a.name) != ''
      `;
      param = identifier;
    } else {
      query = `
        SELECT a.id, a.name, a.created_at, a.updated_at, a.created_by,
          COALESCE(u.name, 'System') as creator_name,
          COALESCE(u.email, '') as creator_email
        FROM authors a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.name = ? AND a.deleted_at IS NULL
          AND a.name IS NOT NULL AND TRIM(a.name) != ''
      `;
      param = identifier;
    }

    const rows = await prisma.$queryRawUnsafe(query, param);
    return this.transformAuthorForFrontend(rows[0] || null);
  },

  async getAuthorByName(name) {
    if (!name || !name.trim()) return null;
    const query = `
      SELECT a.id, a.name, a.created_at, a.updated_at, a.created_by
      FROM authors a
      WHERE a.deleted_at IS NULL 
        AND LOWER(a.name) = LOWER(?)
        AND a.name IS NOT NULL 
        AND TRIM(a.name) != ''
      LIMIT 1
    `;
    const authors = await prisma.$queryRawUnsafe(query, name.trim());
    return authors.length > 0 ? this.transformAuthorForFrontend(authors[0]) : null;
  },

  async createAuthor(authorData) {
    const { name, created_by } = authorData;
    if (!name || name.trim() === '') throw new HttpError('Author name is required', 400);
    if (!created_by) throw new HttpError('Created by user ID is required', 401);

    const trimmedName = name.trim();
    if (trimmedName === '') throw new HttpError('Author name cannot be just whitespace', 400);

    const existing = await prisma.$queryRawUnsafe(
      'SELECT id FROM authors WHERE LOWER(name) = LOWER(?) AND deleted_at IS NULL',
      trimmedName
    );
    if (existing.length > 0) throw new HttpError('Author name already exists', 400);

    const userExists = await prisma.$queryRawUnsafe(
      'SELECT id FROM users WHERE id = ?',
      created_by
    );
    if (userExists.length === 0) throw new HttpError('Invalid created_by user ID', 400);

    const authorId = randomUUID();
    const insertQuery = `
      INSERT INTO authors (id, name, created_by, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    await prisma.$executeRawUnsafe(insertQuery, authorId, trimmedName, created_by);
    return await this.getAuthorById(authorId);
  },

  async updateAuthor(id, updateData) {
    const existingAuthor = await this.getAuthorById(id);
    if (!existingAuthor) throw new HttpError('Author not found', 404);

    const newAuthorName = updateData.name || updateData.author_name;
    if (!newAuthorName || newAuthorName.trim() === '') throw new HttpError('Author name cannot be empty', 400);

    const trimmedName = newAuthorName.trim();
    if (trimmedName === '') throw new HttpError('Author name cannot be just whitespace', 400);

    if (trimmedName !== existingAuthor.name) {
      const existing = await prisma.$queryRawUnsafe(
        'SELECT id FROM authors WHERE LOWER(name) = LOWER(?) AND id != ? AND deleted_at IS NULL',
        trimmedName, id
      );
      if (existing.length > 0) throw new HttpError('Author name already exists', 400);
    }

    const updateQuery = `
      UPDATE authors 
      SET name = ?, updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;
    await prisma.$executeRawUnsafe(updateQuery, trimmedName, id);
    return await this.getAuthorById(id);
  },

  async getAuthorsWithArticleCount() {
    const query = `
      SELECT a.id, a.name, a.created_at, a.updated_at, a.created_by,
        COALESCE(u.name, 'System') as creator_name,
        COUNT(ar.id) as total_articles,
        COUNT(CASE WHEN ar.published_at IS NOT NULL THEN 1 END) as published_articles
      FROM authors a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN articles ar ON a.id = ar.author_id AND ar.deleted_at IS NULL
      WHERE a.deleted_at IS NULL
        AND a.name IS NOT NULL AND TRIM(a.name) != ''
      GROUP BY a.id, a.name, a.created_at, a.updated_at, a.created_by, u.name
      ORDER BY a.created_at DESC
    `;
    const authors = await prisma.$queryRawUnsafe(query);
    return authors.map(author => {
      const transformed = this.transformAuthorForFrontend(author);
      transformed.total_articles = Number(author.total_articles) || 0;
      transformed.published_articles = Number(author.published_articles) || 0;
      transformed.article_count = Number(author.published_articles) || 0;
      return transformed;
    });
  },

  async deleteAuthor(id) {
    const existingAuthor = await this.getAuthorById(id);
    if (!existingAuthor) throw new HttpError('Author tidak ditemukan', 404);

    try {
      const articlesCheckQuery = `
        SELECT COUNT(*) as total_articles,
          COUNT(CASE WHEN published_at IS NOT NULL THEN 1 END) as published_articles,
          COUNT(CASE WHEN published_at IS NULL THEN 1 END) as draft_articles
        FROM articles WHERE author_id = ? AND deleted_at IS NULL
      `;
      const articlesCount = await prisma.$queryRawUnsafe(articlesCheckQuery, id);
      const totalArticles = Number(articlesCount[0].total_articles);
      const publishedArticles = Number(articlesCount[0].published_articles);
      const draftArticles = Number(articlesCount[0].draft_articles);

      if (totalArticles > 0) {
        if (publishedArticles > 0 && draftArticles > 0) {
          throw new HttpError(`Tidak dapat menghapus author yang masih memiliki ${publishedArticles} artikel published dan ${draftArticles} artikel draft.`, 400);
        } else if (publishedArticles > 0) {
          throw new HttpError(`Tidak dapat menghapus author yang masih memiliki ${publishedArticles} artikel published.`, 400);
        } else {
          throw new HttpError(`Tidak dapat menghapus author yang masih memiliki ${draftArticles} artikel draft.`, 400);
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const finalCheck = await tx.$queryRawUnsafe(
          'SELECT COUNT(*) as count FROM articles WHERE author_id = ? AND deleted_at IS NULL',
          id
        );
        if (Number(finalCheck[0].count) > 0) throw new Error('Author masih memiliki artikel yang terkait');
        return await tx.$executeRawUnsafe('DELETE FROM authors WHERE id = ?', id);
      });

      if (!result || (typeof result === 'object' && 'count' in result && result.count === 0)) {
        throw new HttpError('Gagal menghapus author', 500);
      }
      return { success: true, message: 'Author berhasil dihapus' };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      if (error.code === 'P2003' || error.message?.includes('foreign key constraint')) {
        throw new HttpError('Tidak dapat menghapus author yang masih memiliki artikel terkait.', 400);
      }
      if (error.code === '23000' || error.message?.includes('constraint')) {
        throw new HttpError('Tidak dapat menghapus author karena masih ada data yang terkait.', 400);
      }
      if (error.message?.includes('artikel yang terkait')) {
        throw new HttpError(error.message, 400);
      }
      throw new HttpError('Gagal menghapus author', 500);
    }
  },

  async getArticleCountByAuthor(authorId) {
    try {
      const query = `
        SELECT COUNT(*) as total_articles,
          COUNT(CASE WHEN published_at IS NOT NULL THEN 1 END) as published_articles,
          COUNT(CASE WHEN published_at IS NULL THEN 1 END) as draft_articles
        FROM articles WHERE author_id = ? AND deleted_at IS NULL
      `;
      const result = await prisma.$queryRawUnsafe(query, authorId);
      return {
        total: Number(result[0].total_articles) || 0,
        published: Number(result[0].published_articles) || 0,
        draft: Number(result[0].draft_articles) || 0
      };
    } catch {
      return { total: 0, published: 0, draft: 0 };
    }
  }
};

export default authorService;
