import { prisma } from '../utils/db.js';
import { HttpError } from '../utils/error.js';
import { randomUUID } from 'crypto';

const authorService = {
  // ✅ HELPER: Transform database row to frontend format
  transformAuthorForFrontend(author) {
    if (!author) return null;
    
    return {
      id: author.id,
      name: author.name,
      email: author.email,
      role: author.role,
      createdAt: author.created_at,
      updatedAt: author.updated_at,
      editing: false // For frontend inline editing
    };
  },

  // Get all authors - support both system users and custom authors
  async getAllAuthors(options = {}) {
    const { includeCustomAuthors = false } = options;
    
    if (includeCustomAuthors) {
      // Get both system authors and unique custom authors from articles
      const systemAuthorsQuery = `
        SELECT DISTINCT
          u.id,
          u.name,
          u.email,
          u.role,
          u.created_at,
          u.updated_at,
          'system' as author_type
        FROM users u
        WHERE u.role = 'author'
        ORDER BY u.name ASC
      `;

      const customAuthorsQuery = `
        SELECT DISTINCT
          NULL as id,
          a.custom_author as name,
          NULL as email,
          'custom' as role,
          MIN(a.created_at) as created_at,
          MAX(a.updated_at) as updated_at,
          'custom' as author_type
        FROM articles a
        WHERE a.custom_author IS NOT NULL
        GROUP BY a.custom_author
        ORDER BY a.custom_author ASC
      `;

      const [systemAuthors, customAuthors] = await Promise.all([
        prisma.$queryRawUnsafe(systemAuthorsQuery),
        prisma.$queryRawUnsafe(customAuthorsQuery)
      ]);

      // Combine and transform results
      const allAuthors = [
        ...systemAuthors.map(author => this.transformAuthorForFrontend(author)),
        ...customAuthors.map(author => ({
          id: `custom_${author.name}`, // Unique ID for custom authors
          name: author.name,
          email: null,
          role: 'custom',
          createdAt: author.created_at,
          updatedAt: author.updated_at,
          editing: false,
          author_type: 'custom'
        }))
      ];

      return allAuthors.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Get only system authors (existing functionality)
      const authors = await prisma.users.findMany({
        where: {
          role: 'author',
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      return authors.map(author => this.transformAuthorForFrontend(author));
    }
  },

  // ✅ NEW: Get authors for frontend dropdown (combines system + custom)
  async getAuthorsForDropdown() {
    // Get unique custom authors from articles
    const customAuthorsQuery = `
      SELECT DISTINCT a.custom_author as name
      FROM articles a
      WHERE a.custom_author IS NOT NULL
        AND a.published_at IS NOT NULL
      ORDER BY a.custom_author ASC
    `;

    const customAuthors = await prisma.$queryRawUnsafe(customAuthorsQuery);
    
    // Return just the names for frontend compatibility
    return customAuthors.map(author => author.name);
  },

  // ✅ NEW: Get system authors for admin forms (for selecting author_id)
  async getSystemAuthorsForDropdown() {
    const authors = await prisma.users.findMany({
      where: {
        role: 'author',
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return authors.map(author => ({
      id: author.id,
      name: author.name,
      email: author.email
    }));
  },

  // Get single author by ID
  async getAuthorById(id) {
    const author = await prisma.users.findUnique({
      where: {
        id: id,
      },
    });

    if (!author) {
      return null;
    }

    return this.transformAuthorForFrontend(author);
  },

  // Create a new system author
  async createAuthor(authorData) {
    const { name, email } = authorData;

    // Validate required fields
    if (!name || name.trim() === '') {
      throw new HttpError(400, {
        message: 'Author name is required',
        errors: null
      });
    }

    // Check if author name already exists
    const existingAuthor = await prisma.users.findFirst({
      where: {
        name: name.trim(),
        role: 'author'
      },
    });

    if (existingAuthor) {
      throw new HttpError(400, {
        message: 'Author with this name already exists',
        errors: null
      });
    }

    // Check if email already exists (if provided)
    if (email && email.trim() !== '') {
      const existingEmail = await prisma.users.findUnique({
        where: {
          email: email.trim(),
        },
      });

      if (existingEmail) {
        throw new HttpError(400, {
          message: 'Email already exists',
          errors: null
        });
      }
    }

    // Generate UUID for author ID
    const authorId = randomUUID();

    const newAuthor = await prisma.users.create({
      data: {
        id: authorId,
        name: name.trim(),
        email: email?.trim() || null,
        role: 'author',
      },
    });

    return this.transformAuthorForFrontend(newAuthor);
  },

  // Update an existing system author
  async updateAuthor(id, updateData) {
    const { name, email } = updateData;

    // Check if author exists
    const author = await prisma.users.findUnique({
      where: {
        id,
      },
    });

    if (!author) {
      throw new HttpError(404, {
        message: 'Author not found',
        errors: null
      });
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim() === '') {
        throw new HttpError(400, {
          message: 'Author name cannot be empty',
          errors: null
        });
      }

      // Check if new name already exists (excluding current author)
      const existingName = await prisma.users.findFirst({
        where: {
          name: name.trim(),
          role: 'author',
          id: {
            not: id
          }
        },
      });

      if (existingName) {
        throw new HttpError(400, {
          message: 'Author with this name already exists',
          errors: null
        });
      }
    }

    // Validate email if provided
    if (email !== undefined && email.trim() !== '') {
      const existingEmail = await prisma.users.findUnique({
        where: {
          email: email.trim(),
        },
      });

      if (existingEmail && existingEmail.id !== id) {
        throw new HttpError(400, {
          message: 'Email already exists',
          errors: null
        });
      }
    }

    // Prepare update data
    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (email !== undefined) updatePayload.email = email?.trim() || null;

    const updatedAuthor = await prisma.users.update({
      where: {
        id,
      },
      data: updatePayload,
    });

    return this.transformAuthorForFrontend(updatedAuthor);
  },

  // Delete a system author
  async deleteAuthor(id) {
    // Check if author exists
    const author = await prisma.users.findUnique({
      where: {
        id,
      },
    });

    if (!author) {
      throw new HttpError(404, {
        message: 'Author not found',
        errors: null
      });
    }

    // Check if author has published articles
    const articlesCount = await prisma.$queryRawUnsafe(
      'SELECT COUNT(*) as count FROM articles WHERE author_id = ? AND published_at IS NOT NULL',
      id
    );

    if (Number(articlesCount[0].count) > 0) {
      throw new HttpError(400, {
        message: 'Cannot delete author who has published articles. Please reassign or unpublish the articles first.',
        errors: null
      });
    }

    await prisma.users.delete({
      where: {
        id,
      },
    });

    return true;
  },

  // ✅ NEW: Validate if custom author name can be used
  async validateCustomAuthor(customAuthorName) {
    if (!customAuthorName || customAuthorName.trim() === '') {
      throw new HttpError(400, {
        message: 'Custom author name is required',
        errors: null
      });
    }

    // Check if it conflicts with existing system author
    const existingSystemAuthor = await prisma.users.findFirst({
      where: {
        name: customAuthorName.trim(),
        role: 'author'
      }
    });

    if (existingSystemAuthor) {
      throw new HttpError(400, {
        message: 'This name is already used by a system author. Please choose a different name.',
        errors: null
      });
    }

    return true;
  },

  // ✅ NEW: Get author statistics
  async getAuthorStats(authorIdentifier) {
    let whereCondition, queryParam;
    
    if (typeof authorIdentifier === 'string' && !authorIdentifier.includes('custom_')) {
      // Custom author by name
      whereCondition = 'a.custom_author = ?';
      queryParam = authorIdentifier;
    } else {
      // System author by ID
      whereCondition = 'a.author_id = ?';
      queryParam = authorIdentifier;
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_articles,
        COUNT(CASE WHEN a.published_at IS NOT NULL THEN 1 END) as published_articles,
        COUNT(CASE WHEN a.published_at IS NULL THEN 1 END) as draft_articles,
        MIN(a.created_at) as first_article,
        MAX(a.created_at) as latest_article
      FROM articles a
      WHERE ${whereCondition}
    `;

    const result = await prisma.$queryRawUnsafe(statsQuery, queryParam);
    const stats = result[0];

    return {
      total_articles: Number(stats.total_articles) || 0,
      published_articles: Number(stats.published_articles) || 0,
      draft_articles: Number(stats.draft_articles) || 0,
      first_article: stats.first_article,
      latest_article: stats.latest_article
    };
  }
};

export default authorService;