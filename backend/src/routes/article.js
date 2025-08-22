import express from 'express';
import articleController from '../controllers/article.js';
import categoryController from '../controllers/category.js';
import authorController from '../controllers/author.js';
import { AuthMiddleware } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { 
  validateArticle, 
  validateCategory,
  validateArticleUpdate,
  validateCategoryUpdate,
  validateAuthor,
  validateAuthorUpdate
} from '../middlewares/validation/article.js';

const router = express.Router();

// ========== PUBLIC ROUTES ==========
router.get('/public/articles', articleController.getPublishedArticles);
router.get('/public/articles/:id', articleController.getPublishedArticleBySlug);
router.get('/public/articles/:slug/validate', articleController.validateArticleSlug);
router.get('/public/articles/:id/related', articleController.getRelatedArticles);

router.get('/public/categories', categoryController.getAllCategories);
router.get('/public/categories/with-count', categoryController.getCategoriesWithCount);
router.get('/public/categories/:id', categoryController.getCategoryById);
router.get('/public/categories/:categoryId/articles', articleController.getArticlesByCategory);

router.get('/public/authors', articleController.getUniqueAuthors);

router.get('/articles/published', articleController.getPublishedArticles);
router.get('/articles/published/:id', articleController.getPublishedArticleBySlug);
router.get('/articles/category/:categoryId/published', articleController.getArticlesByCategory);

// ========== ADMIN ROUTES ==========
router.get(
  '/admin/articles',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.hasRole(['admin']),
  articleController.getAllArticles
);

router.get(
  '/admin/articles/:id',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.hasRole(['admin']),
  articleController.getArticleById
);

router.post(
  '/admin/articles',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.hasRole(['admin']),
  upload.single('mainImage'),
  validateArticle,
  articleController.createArticle
);

router.put(
  '/admin/articles/:id',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.hasRole(['admin']),
  upload.single('mainImage'),
  validateArticleUpdate,
  articleController.updateArticle
);

router.patch(
  '/admin/articles/:id/toggle-publish',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.hasRole(['admin']),
  articleController.togglePublishStatus
);

router.delete(
  '/admin/articles/:id',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.hasRole(['admin']),
  articleController.deleteArticle
);

// Categories
router.get(
  '/admin/categories',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.hasRole(['admin']),
  categoryController.getAllCategories
);

router.post(
  '/admin/categories',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.hasRole(['admin']),
  validateCategory,
  categoryController.createCategory
);

router.put(
  '/admin/categories/:id',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.hasRole(['admin']),
  validateCategoryUpdate,
  categoryController.updateCategory
);

router.delete(
  '/admin/categories/:id',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.hasRole(['admin']),
  categoryController.deleteCategory
);

// Authors
router.get(
  '/admin/authors',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.hasRole(['admin']),
  authorController.getAllAuthors
);

router.post(
  '/admin/authors',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.hasRole(['admin']),
  validateAuthor,
  authorController.createAuthor
);

router.put(
  '/admin/authors/:id',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.hasRole(['admin']),
  validateAuthorUpdate,
  authorController.updateAuthor
);

router.delete(
  '/admin/authors/:id',
  AuthMiddleware.isAuthorized,
  AuthMiddleware.hasRole(['admin']),
  authorController.deleteAuthor
);

export default router;
