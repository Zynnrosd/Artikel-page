import { asyncWrapper } from '../utils/asyncWrapper.js';
import { HttpError } from '../utils/error.js';
import authorService from '../services/author.js'; 

const authorController = {
  // ✅ FRONTEND NEEDS: Get all authors for dropdown and management
  getAllAuthors: asyncWrapper(async (req, res) => {
    console.log('=== GET ALL AUTHORS DEBUG ===');
    
    const authors = await authorService.getAllAuthors();
    
    // ✅ FRONTEND FORMAT: { id, name } format expected by frontend
    const formattedAuthors = authors.map(author => ({
      id: author.id,
      name: author.name
    }));
    
    console.log('Formatted authors:', formattedAuthors);
    
    res.status(200).json({
      success: true,
      message: 'Authors retrieved successfully',
      data: formattedAuthors
    });
  }),

  createAuthor: asyncWrapper(async (req, res) => {
    console.log('=== CREATE AUTHOR DEBUG ===');
    console.log('req.body:', req.body);
    
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      throw new HttpError('Nama Author tidak boleh kosong', 400);
    }

    const trimmedName = name.trim();

    // ✅ VALIDATION: Check duplicate name
    const existingAuthor = await authorService.getAuthorByName(trimmedName);
    if (existingAuthor) {
      throw new HttpError('Author sudah ada', 400);
    }

    const author = await authorService.createAuthor(trimmedName);
    
    // ✅ FRONTEND FORMAT: Return in expected format
    const formattedAuthor = {
      id: author.id,
      name: author.name
    };
    
    res.status(201).json({
      success: true,
      message: 'Author berhasil ditambahkan',
      data: formattedAuthor
    });
  }),

  updateAuthor: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    console.log('=== UPDATE AUTHOR DEBUG ===');
    console.log('author id:', id);
    console.log('req.body:', req.body);

    if (!name || name.trim() === '') {
      throw new HttpError('Nama Author tidak boleh kosong', 400);
    }

    const trimmedName = name.trim();

    // ✅ VALIDATION: Check duplicate name (exclude current author)
    const existingAuthor = await authorService.getAuthorByName(trimmedName);
    if (existingAuthor && existingAuthor.id !== id) {
      throw new HttpError('Author sudah ada', 400);
    }

    const updatedAuthor = await authorService.updateAuthor(id, trimmedName);
    
    // ✅ FRONTEND FORMAT: Return in expected format
    const formattedAuthor = {
      id: updatedAuthor.id,
      name: updatedAuthor.name
    };
    
    res.status(200).json({
      success: true,
      message: 'Author berhasil diperbarui',
      data: formattedAuthor
    });
  }),

  deleteAuthor: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    console.log('=== DELETE AUTHOR DEBUG ===');
    console.log('author id:', id);

    // ✅ FRONTEND NEEDS: Check if author is being used by articles
    const articlesCount = await authorService.getArticleCountByAuthor(id);
    if (articlesCount > 0) {
      throw new HttpError(
        `Cannot delete author. They have ${articlesCount} article(s)`,
        400
      );
    }

    await authorService.deleteAuthor(id);
    
    res.status(200).json({
      success: true,
      message: 'Author berhasil dihapus'
    });
  }),

  // ✅ FRONTEND MIGHT NEED: Get author by ID (for individual author page)
  getAuthorById: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    
    console.log('=== GET AUTHOR BY ID DEBUG ===');
    console.log('author id:', id);
    
    const author = await authorService.getAuthorById(id);
    
    if (!author) {
      throw new HttpError('Author not found', 404);
    }

    // ✅ FRONTEND FORMAT: Return in expected format
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

  // ✅ FRONTEND MIGHT NEED: Get articles by author (for author page)
  getArticlesByAuthor: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10, published = 'true' } = req.query;
    
    console.log('=== GET ARTICLES BY AUTHOR DEBUG ===');
    console.log('author id:', id);
    console.log('query params:', { page, limit, published });
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      published: published === 'true' ? true : published === 'false' ? false : null
    };

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
  })
};

export default authorController;