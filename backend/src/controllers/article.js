import articleService from '../services/article.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { HttpError } from '../utils/error.js';
import { cleanupTempFile, debugUploadsFolder } from '../middlewares/upload.js';

const articleController = {
  getAllArticles: asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10, category, author, search, published } = req.query;

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

  getPublishedArticles: asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10, category, search, author } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      search,
      author,
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

  getPublishedArticleBySlug: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const isValid = await articleService.isValidPublishedArticle(id);

    if (!isValid) {
      throw new HttpError('Article not found', 404);
    }

    const article = await articleService.getArticleById(id);

    if (!article || !article.is_published) {
      throw new HttpError('Article not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Article retrieved successfully',
      data: article
    });
  }),

  validateArticleSlug: asyncWrapper(async (req, res) => {
    const { slug } = req.params;
    const isValid = await articleService.isValidPublishedArticle(slug);

    res.status(200).json({
      success: true,
      message: 'Slug validation result',
      data: { isValid, slug }
    });
  }),

  createArticle: asyncWrapper(async (req, res) => {
    debugUploadsFolder();
    try {
      let parsedBody = { ...req.body };

      const articleData = {
        title: parsedBody.title?.trim(),
        content: parsedBody.content?.trim(),
        category_id: parsedBody.category,
        author_name: parsedBody.author?.trim(),
        created_by_user_id: res.locals.user.id,
        is_published: false,
        featured_image: null
      };

      if (!articleData.title) throw new HttpError('Title is required', 400);
      if (!articleData.content) throw new HttpError('Content is required', 400);
      if (!articleData.category_id) throw new HttpError('Category is required', 400);
      if (!articleData.author_name) throw new HttpError('Author is required', 400);

      const categoryValidation = await articleService.validateCategory(articleData.category_id);
      if (!categoryValidation.isValid) {
        throw new HttpError(categoryValidation.error, 400);
      }
      articleData.category_id = categoryValidation.categoryId;

      if (req.file) {
        articleData.featured_image = req.file.filename;
      }

      if (!articleData.featured_image) {
        throw new HttpError('Featured image is required', 400);
      }

      const article = await articleService.createArticle(articleData);
      debugUploadsFolder();

      res.status(201).json({
        success: true,
        message: 'Article created successfully as draft',
        data: article
      });
    } catch (error) {
      if (req.file) cleanupTempFile(req.file.filename);
      throw error;
    }
  }),

  updateArticle: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    debugUploadsFolder();

    try {
      let parsedBody = { ...req.body };
      const updateData = {};

      if (parsedBody.title !== undefined) updateData.title = parsedBody.title?.trim();
      if (parsedBody.content !== undefined) updateData.content = parsedBody.content?.trim();

      if (parsedBody.category !== undefined) {
        const categoryValidation = await articleService.validateCategory(parsedBody.category);
        if (!categoryValidation.isValid) {
          throw new HttpError(categoryValidation.error, 400);
        }
        updateData.category_id = categoryValidation.categoryId;
      }

      if (parsedBody.author !== undefined) {
        updateData.author_name = parsedBody.author?.trim();
        updateData.created_by_user_id = res.locals.user.id;
      }

      if (parsedBody.status !== undefined) {
        updateData.is_published = parsedBody.status === 'published';
      }

      if (req.file) {
        updateData.featured_image = req.file.filename;
      }

      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      const article = await articleService.updateArticle(id, updateData);
      debugUploadsFolder();

      res.status(200).json({
        success: true,
        message: 'Article updated successfully',
        data: article
      });
    } catch (error) {
      if (req.file) cleanupTempFile(req.file.filename);
      throw error;
    }
  }),

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

  getUniqueAuthors: asyncWrapper(async (req, res) => {
    const authors = await articleService.getUniqueAuthors();

    res.status(200).json({
      success: true,
      message: 'Authors retrieved successfully',
      data: authors
    });
  }),

  getRelatedArticles: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const article = await articleService.getArticleById(id);

    if (!article) throw new HttpError('Article not found', 404);

    const relatedArticles = await articleService.getRelatedArticles(article.id, article.category_id);

    res.status(200).json({
      success: true,
      message: `Found ${relatedArticles.length} related articles`,
      data: relatedArticles
    });
  })
};

export default articleController;
