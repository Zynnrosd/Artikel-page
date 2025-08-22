import { asyncWrapper } from '../utils/asyncWrapper.js';
import { HttpError } from '../utils/error.js';
import authorService from '../services/author.js';
import articleService from '../services/article.js';

const authorController = {
  getAllAuthors: asyncWrapper(async (req, res) => {
    const { page, limit, search } = req.query;

    if (req.path.includes('/public/')) {
      try {
        const authorsData = await authorService.getAuthorsForDropdown();
        const formattedAuthors = authorsData
          .filter(author => author.label && author.label.trim() !== '')
          .map(author => ({
            id: author.id,
            name: author.label || author.key || 'Unknown Author'
          }));

        res.status(200).json({
          success: true,
          message: 'Authors retrieved successfully',
          data: formattedAuthors
        });
      } catch {
        res.status(200).json({
          success: true,
          message: 'Authors retrieved successfully (fallback)',
          data: [{ id: null, name: 'Unknown Author' }]
        });
      }
    } else {
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        search
      };

      try {
        const result = await authorService.getAllAuthors(options);
        const authorsArray = result.authors || result.data || result || [];
        const formattedAuthors = authorsArray
          .filter(author =>
            author.name &&
            author.name.trim() !== '' &&
            author.name !== 'Unnamed Author' &&
            author.name !== 'Unknown Author'
          )
          .map(author => ({
            id: author.id,
            name: author.name || 'Unknown Author'
          }));

        res.status(200).json({
          success: true,
          message: 'Authors retrieved successfully',
          data: formattedAuthors,
          pagination: {
            currentPage: result.currentPage || 1,
            totalPages: result.totalPages || 1,
            totalItems: result.totalItems || formattedAuthors.length,
            hasNext: result.hasNext || false,
            hasPrev: result.hasPrev || false
          }
        });
      } catch {
        res.status(200).json({
          success: true,
          message: 'Authors retrieved successfully (fallback)',
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

  getAuthorsWithCount: asyncWrapper(async (req, res) => {
    try {
      const authors = await authorService.getAuthorsWithArticleCount();
      let authorsArray = [];

      if (Array.isArray(authors)) {
        authorsArray = authors;
      } else if (authors.data && Array.isArray(authors.data)) {
        authorsArray = authors.data;
      } else if (authors.authors && Array.isArray(authors.authors)) {
        authorsArray = authors.authors;
      }

      const formattedAuthors = authorsArray
        .filter(author =>
          author.name &&
          author.name.trim() !== '' &&
          author.name !== 'Unnamed Author' &&
          author.name !== 'Unknown Author'
        )
        .map(author => ({
          id: author.id,
          name: author.name,
          article_count: author.published_articles || author.articleCount || author.article_count || 0
        }));

      res.status(200).json({
        success: true,
        message: 'Authors with count retrieved successfully',
        data: formattedAuthors
      });
    } catch {
      try {
        const basicAuthors = await authorService.getAuthorsForDropdown();
        const fallbackAuthors = basicAuthors
          .filter(author => author.label && author.label.trim() !== '')
          .map(author => ({
            id: author.id,
            name: author.label,
            article_count: 0
          }));

        res.status(200).json({
          success: true,
          message: 'Authors retrieved successfully (fallback)',
          data: fallbackAuthors
        });
      } catch {
        res.status(200).json({
          success: true,
          message: 'Authors retrieved successfully (empty fallback)',
          data: []
        });
      }
    }
  }),

  createAuthor: asyncWrapper(async (req, res) => {
    let authorName;

    if (req.body.name) {
      authorName = req.body.name.trim();
    } else {
      throw new HttpError('Nama Author tidak boleh kosong', 400);
    }

    if (!authorName || authorName === '') {
      throw new HttpError('Nama author tidak boleh kosong atau hanya berisi spasi', 400);
    }

    try {
      const existingAuthor = await authorService.getAuthorByName(authorName);
      if (existingAuthor) {
        throw new HttpError('Author sudah ada', 400);
      }
    } catch (error) {
      if (error.message === 'Author sudah ada') throw error;
    }

    const authorData = {
      name: authorName,
      created_by: res.locals.user?.id
    };

    if (!authorData.created_by) {
      throw new HttpError('Unauthorized: User not authenticated', 401);
    }

    try {
      const author = await authorService.createAuthor(authorData);

      if (!author || !author.id) {
        throw new HttpError('Gagal membuat author - data tidak valid', 500);
      }

      if (!author.name || author.name.trim() === '') {
        throw new HttpError('Gagal membuat author - nama author tidak valid', 500);
      }

      const formattedAuthor = {
        id: author.id,
        name: author.name
      };

      res.status(201).json({
        success: true,
        message: 'Author berhasil ditambahkan',
        data: formattedAuthor
      });
    } catch (error) {
      if (error.statusCode === 400) {
        throw new HttpError(error.message || 'Gagal membuat author', 400);
      }
      throw new HttpError('Gagal membuat author', 500);
    }
  }),

  updateAuthor: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    let authorName;

    if (req.body.name) {
      authorName = req.body.name.trim();
    } else {
      throw new HttpError('Nama Author tidak boleh kosong', 400);
    }

    if (!authorName || authorName === '') {
      throw new HttpError('Nama author tidak boleh kosong atau hanya berisi spasi', 400);
    }

    try {
      const existingAuthor = await authorService.getAuthorByName(authorName);
      if (existingAuthor && existingAuthor.id !== id) {
        throw new HttpError('Author sudah ada', 400);
      }
    } catch (error) {
      if (error.message === 'Author sudah ada') throw error;
    }

    const updateData = { name: authorName };

    try {
      const updatedAuthor = await authorService.updateAuthor(id, updateData);

      if (!updatedAuthor || !updatedAuthor.name || updatedAuthor.name.trim() === '') {
        throw new HttpError('Gagal memperbarui author - data tidak valid', 500);
      }

      const formattedAuthor = {
        id: updatedAuthor.id,
        name: updatedAuthor.name
      };

      res.status(200).json({
        success: true,
        message: 'Author berhasil diperbarui',
        data: formattedAuthor,
        refreshRequired: true,
        refreshType: 'articles',
        updatedAuthorId: id,
        updatedAuthorName: formattedAuthor.name
      });
    } catch (error) {
      if (error.statusCode === 400) {
        throw new HttpError(error.message || 'Gagal memperbarui author', 400);
      }
      throw new HttpError('Gagal memperbarui author', 500);
    }
  }),

  deleteAuthor: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    try {
      const result = await authorService.deleteAuthor(id);

      return res.status(200).json({
        success: true,
        message: result.message || 'Author berhasil dihapus',
        refreshRequired: true,
        refreshType: 'articles',
        deletedAuthorId: id
      });
    } catch (error) {
      let statusCode = 500;
      let errorMessage = 'Terjadi kesalahan saat menghapus author';

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
        errorMessage = 'Tidak dapat menghapus author yang masih memiliki artikel terkait.';
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
  }),

  getAuthorById: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const author = await authorService.getAuthorById(id);

    if (!author) {
      throw new HttpError('Author not found', 404);
    }

    const formattedAuthor = {
      id: author.id,
      name: author.name
    };

    res.status(200).json({
      success: true,
      message: 'Author retrieved successfully',
      data: formattedAuthor
    });
  }),

  getArticlesByAuthor: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10, published = 'true' } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      published: published === 'true' ? true : published === 'false' ? false : null
    };

    try {
      const result = await authorService.getArticlesByAuthor(id, options);

      res.status(200).json({
        success: true,
        message: 'Articles retrieved successfully',
        data: result.articles,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalItems: result.totalItems,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev
        }
      });
    } catch {
      res.status(200).json({
        success: true,
        message: 'Articles retrieved successfully',
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
  }),

  getRefreshedArticleData: asyncWrapper(async (req, res) => {
    const { page, limit, search, category, author, status } = req.query;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      category,
      author,
      status
    };

    try {
      const result = await articleService.getAllArticles(options);

      res.status(200).json({
        success: true,
        message: 'Fresh article data retrieved successfully',
        data: result.articles || result.data || [],
        pagination: {
          currentPage: result.currentPage || 1,
          totalPages: result.totalPages || 1,
          totalItems: result.totalItems || 0,
          hasNext: result.hasNext || false,
          hasPrev: result.hasPrev || false
        }
      });
    } catch {
      res.status(200).json({
        success: true,
        message: 'Fresh article data retrieved successfully (fallback)',
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
  })
};

export default authorController;
