import express from 'express';
import articleController from '../controllers/article.js';
import categoryController from '../controllers/category.js';
import { AuthMiddleware } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { 
  validateArticle, 
  validateCategory,
  validateArticleUpdate,
  validateCategoryUpdate 
} from '../middlewares/validation/article.js';

const router = express.Router();

// ========== PUBLIC ROUTES (No Authentication Required) ==========

// Public Article routes
router.get('/public/articles', articleController.getPublishedArticles); // All published articles for public
router.get('/public/articles/:slug', articleController.getPublishedArticleBySlug); // Single article by slug for public
router.get('/public/categories/:categoryId/articles', articleController.getArticlesByCategory); // Published articles by category for public

// Public Category routes
router.get('/public/categories', categoryController.getAllCategories); // All categories for public
router.get('/public/categories/with-count', categoryController.getCategoriesWithCount); // Categories with article count for public
router.get('/public/categories/:id', categoryController.getCategoryById); // Single category for public

// Alternative public routes (backward compatibility)
router.get('/articles/published', articleController.getPublishedArticles);
router.get('/articles/published/:slug', articleController.getPublishedArticleBySlug);
router.get('/articles/category/:categoryId/published', articleController.getArticlesByCategory);

// ========== ADMIN ROUTES (Authentication Required) ==========

// Admin Article routes - need authentication
router.get('/admin/articles', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  articleController.getAllArticles
); // Admin view all articles (published & unpublished)

router.get('/admin/articles/:id', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  articleController.getArticleById
); // Admin view single article

router.get('/admin/articles/category/:categoryId', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  articleController.getArticlesByCategory
); // Admin view articles by category (including unpublished)

// CRUD operations - Admin only
router.post('/admin/articles', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  upload.single('featured_image'), 
  validateArticle, // ✅ Untuk CREATE - validasi lengkap
  articleController.createArticle
);

router.put('/admin/articles/:id', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  upload.single('featured_image'), 
  validateArticleUpdate, // ✅ Untuk UPDATE - validasi partial
  articleController.updateArticle
);

// Toggle publish status
router.patch('/admin/articles/:id/toggle-publish', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  articleController.togglePublishStatus
);

router.delete('/admin/articles/:id', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  articleController.deleteArticle
);

// Admin Category routes - need authentication
router.post('/admin/categories', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  validateCategory, // ✅ Untuk CREATE - validasi lengkap
  categoryController.createCategory
);

router.put('/admin/categories/:id', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  validateCategoryUpdate, // ✅ Untuk UPDATE - validasi partial
  categoryController.updateCategory
);

router.delete('/admin/categories/:id', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  categoryController.deleteCategory
);

export default router;