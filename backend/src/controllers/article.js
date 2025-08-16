import articleService from '../services/article.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { HttpError } from '../utils/error.js';
import { cleanupTempFile } from '../middlewares/upload.js';

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
    const { page = 1, limit = 10, category, search, author } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      search,
      author, // ✅ ADDED: Support author filter for frontend
      published: true
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

  // Get published article by slug or ID (for public view)
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
      
      // ✅ FRONTEND MAPPING: Map frontend fields to backend fields
      const articleData = {
        title: parsedBody.title?.trim(),
        content: parsedBody.content?.trim(),
        category_id: parsedBody.category, // ✅ Frontend sends 'category', backend expects 'category_id'
        custom_author: parsedBody.author?.trim(), // ✅ Frontend sends 'author', backend expects 'custom_author'
        author_id: res.locals.user.id,
        is_published: true, // ✅ Frontend always publishes directly
        featured_image: null
      };
      
      // ✅ VALIDATION: Ensure required fields
      if (!articleData.title) {
        throw new HttpError('Title is required', 400);
      }
      
      if (!articleData.content) {
        throw new HttpError('Content is required', 400);
      }
      
      if (!articleData.category_id) {
        throw new HttpError('Category is required', 400);
      }
      
      if (!articleData.custom_author) {
        throw new HttpError('Author is required', 400);
      }
      
      // Handle file upload
      if (req.file) {
        console.log('Using uploaded file from temp:', req.file.filename);
        articleData.featured_image = req.file.filename;
      }
      
      if (!articleData.featured_image) {
        throw new HttpError('Featured image is required', 400);
      }

      console.log('Final article data:', articleData);

      const article = await articleService.createArticle(articleData);
      
      res.status(201).json({
        success: true,
        message: 'Article created successfully',
        data: article
      });
      
    } catch (error) {
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
      
      // ✅ FRONTEND MAPPING: Map frontend fields to backend fields
      const updateData = {};
      
      if (parsedBody.title !== undefined) {
        updateData.title = parsedBody.title?.trim();
      }
      
      if (parsedBody.content !== undefined) {
        updateData.content = parsedBody.content?.trim();
      }
      
      if (parsedBody.category !== undefined) {
        updateData.category_id = parsedBody.category; // Frontend sends 'category'
      }
      
      if (parsedBody.author !== undefined) {
        updateData.custom_author = parsedBody.author?.trim(); // Frontend sends 'author'
      }
      
      // Handle publish status changes (draft/publish buttons)
      if (parsedBody.status !== undefined) {
        updateData.is_published = parsedBody.status === 'published';
      }
      
      // Handle file upload
      if (req.file) {
        console.log('Using uploaded file from temp:', req.file.filename);
        updateData.featured_image = req.file.filename;
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
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
      if (req.file) {
        console.log('Cleaning up temp file due to error:', req.file.filename);
        cleanupTempFile(req.file.filename);
      }
      throw error;
    }
  }),

  // ✅ FRONTEND NEEDS: Toggle publish status for draft/publish buttons
  togglePublishStatus: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    
    const article = await articleService.togglePublishStatus(id);
    
    res.status(200).json({
      success: true,
      message: `Article ${article.is_published ? 'published' : 'drafted'} successfully`,
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
  }),

  // ✅ FRONTEND NEEDS: Get unique authors for filter dropdown
  getUniqueAuthors: asyncWrapper(async (req, res) => {
    const authors = await articleService.getUniqueAuthors();
    
    res.status(200).json({
      success: true,
      message: 'Authors retrieved successfully',
      data: authors
    });
  }),

  // ✅ FRONTEND NEEDS: Get related articles by category
  getRelatedArticles: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { limit = 5 } = req.query;
    
    const relatedArticles = await articleService.getRelatedArticles(id, parseInt(limit));
    
    res.status(200).json({
      success: true,
      message: 'Related articles retrieved successfully',
      data: relatedArticles
    });
  })
};

export default articleController;