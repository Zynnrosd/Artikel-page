import articleService from '../services/article.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { HttpError } from '../utils/error.js';
import { cleanupTempFile } from '../middlewares/upload.js'; // Hanya import cleanup

const articleController = {

  // Get all articles (with admin filters)
  getAllArticles: asyncWrapper(async (req, res) => {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      author, 
      search, 
      published 
    } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      author,
      search,
      published: published === 'true' ? true : published === 'false' ? false : null
    };

    const result = await articleService.getAllArticles(options);
    
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
  }),

  // Get published articles for public view
  getPublishedArticles: asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10, category, search } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      search,
      published: true // Only published articles
    };

    const result = await articleService.getPublishedArticles(options);
    
    res.status(200).json({
      success: true,
      message: 'Published articles retrieved successfully',
      data: result.articles,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    });
  }),

  getArticleById: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const article = await articleService.getArticleById(id);
    
    if (!article) {
      throw new HttpError('Article not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Article retrieved successfully',
      data: article
    });
  }),

  // Get published article by slug (for public view)
  getPublishedArticleBySlug: asyncWrapper(async (req, res) => {
    const { slug } = req.params;
    const article = await articleService.getArticleById(slug);
    
    if (!article) {
      throw new HttpError('Article not found', 404);
    }

    // Check if article is published
    if (!article.is_published) {
      throw new HttpError('Article not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Article retrieved successfully',
      data: article
    });
  }),

  createArticle: asyncWrapper(async (req, res) => {
    console.log('=== CREATE ARTICLE DEBUG ===');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    console.log('Content-Type:', req.headers['content-type']);
    
    try {
      // Handle form-data parsing
      let parsedBody = { ...req.body };
      
      // Convert string 'true'/'false' to boolean for is_published
      if (parsedBody.is_published) {
        parsedBody.is_published = parsedBody.is_published === 'true' || parsedBody.is_published === true;
      } else {
        parsedBody.is_published = false;
      }
      
      // ✅ VALIDASI TAMBAHAN: Pastikan custom_author tidak kosong
      if (!parsedBody.custom_author || parsedBody.custom_author.trim() === '') {
        throw new HttpError('Custom author is required and cannot be empty', 400);
      }
      
      console.log('Parsed body:', parsedBody);
      
      // ✅ PERUBAHAN: Langsung gunakan filename dari temp folder
      // Tidak perlu moveFileFromTemp lagi
      let imageFilename = null;
      if (req.file) {
        console.log('Using uploaded file from temp:', req.file.filename);
        imageFilename = req.file.filename; // Langsung gunakan filename dari temp
      }
      
      const articleData = {
        ...parsedBody,
        author_id: res.locals.user.id,
        featured_image: imageFilename // File tetap di temp folder
      };

      console.log('Final article data:', articleData);

      const article = await articleService.createArticle(articleData);
      
      res.status(201).json({
        success: true,
        message: 'Article created successfully',
        data: article
      });
      
    } catch (error) {
      // ✅ PERUBAHAN: Hanya cleanup temp file jika ada error
      if (req.file) {
        console.log('Cleaning up temp file due to error:', req.file.filename);
        cleanupTempFile(req.file.filename);
      }
      
      throw error;
    }
  }),

  updateArticle: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    
    console.log('=== UPDATE ARTICLE DEBUG ===');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    
    try {
      // Handle form-data parsing
      let parsedBody = { ...req.body };
      
      // Convert string 'true'/'false' to boolean for is_published
      if (parsedBody.is_published !== undefined) {
        parsedBody.is_published = parsedBody.is_published === 'true' || parsedBody.is_published === true;
      }
      
      // ✅ VALIDASI TAMBAHAN: Jika custom_author ada dalam update, pastikan tidak kosong
      if (parsedBody.custom_author !== undefined && 
          (!parsedBody.custom_author || parsedBody.custom_author.trim() === '')) {
        throw new HttpError('Custom author cannot be empty', 400);
      }
      
      // ✅ PERUBAHAN: Langsung gunakan filename dari temp folder
      let imageFilename = undefined;
      if (req.file) {
        console.log('Using uploaded file from temp:', req.file.filename);
        imageFilename = req.file.filename; // Langsung gunakan filename dari temp
      }
      
      const updateData = {
        ...parsedBody,
        featured_image: imageFilename // undefined jika tidak ada file baru
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      console.log('Final update data:', updateData);

      const article = await articleService.updateArticle(id, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Article updated successfully',
        data: article
      });
      
    } catch (error) {
      // ✅ PERUBAHAN: Hanya cleanup temp file jika ada error
      if (req.file) {
        console.log('Cleaning up temp file due to error:', req.file.filename);
        cleanupTempFile(req.file.filename);
      }
      
      throw error;
    }
  }),

  // Toggle publish status
  togglePublishStatus: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    
    const article = await articleService.togglePublishStatus(id);
    
    res.status(200).json({
      success: true,
      message: `Article ${article.is_published ? 'published' : 'unpublished'} successfully`,
      data: article
    });
  }),

  deleteArticle: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    
    await articleService.deleteArticle(id);
    
    res.status(200).json({
      success: true,
      message: 'Article deleted successfully'
    });
  }),

  getArticlesByCategory: asyncWrapper(async (req, res) => {
    const { categoryId } = req.params;
    const { page = 1, limit = 10, published = 'true' } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      published: published === 'true' ? true : published === 'false' ? false : null
    };

    const result = await articleService.getArticlesByCategory(categoryId, options);
    
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

export default articleController;