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

// ========== PUBLIC ROUTES (No Authentication Required) ==========

router.get('/public/articles', articleController.getPublishedArticles); // Frontend artikel list page
router.get('/public/articles/:id', articleController.getPublishedArticleBySlug); // Frontend artikel detail page
router.get('/public/articles/:id/related', articleController.getRelatedArticles); // ✅ NEW: Related articles


router.get('/public/categories', categoryController.getAllCategories); // Frontend category tabs
router.get('/public/categories/with-count', categoryController.getCategoriesWithCount); // Frontend with article counts
router.get('/public/categories/:id', categoryController.getCategoryById);
router.get('/public/categories/:categoryId/articles', articleController.getArticlesByCategory); // Articles by category

// ✅ FRONTEND NEEDS: Public Authors for filter
router.get('/public/authors', articleController.getUniqueAuthors); // Frontend author filter dropdown

// Alternative routes for backward compatibility
router.get('/articles/published', articleController.getPublishedArticles);
router.get('/articles/published/:id', articleController.getPublishedArticleBySlug);
router.get('/articles/category/:categoryId/published', articleController.getArticlesByCategory);

// ========== ADMIN ROUTES (Authentication Required) ==========

// ✅ FRONTEND ADMIN NEEDS: Article management routes
router.get('/admin/articles', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  articleController.getAllArticles
); // Admin dashboard articles list

router.get('/admin/articles/:id', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  articleController.getArticleById
); // Admin view single article

// ✅ FRONTEND FORM: Create new article
router.post('/admin/articles', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  upload.single('mainImage'), // ✅ FRONTEND SENDS: 'mainImage' field
  validateArticle,
  articleController.createArticle
);

// ✅ FRONTEND FORM: Update existing article
router.put('/admin/articles/:id', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  upload.single('mainImage'), // ✅ FRONTEND SENDS: 'mainImage' field for updates
  validateArticleUpdate,
  articleController.updateArticle
);

// ✅ FRONTEND BUTTONS: Toggle publish/draft status
router.patch('/admin/articles/:id/toggle-publish', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  articleController.togglePublishStatus
);

// ✅ FRONTEND BUTTON: Delete article
router.delete('/admin/articles/:id', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  articleController.deleteArticle
);

// ========== ADMIN CATEGORY MANAGEMENT ==========

// ✅ FRONTEND NEEDS: Category management for dropdown populate
router.get('/admin/categories', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  categoryController.getAllCategories
); // Get categories for form dropdowns

// ✅ FRONTEND FORM: Create new category
router.post('/admin/categories', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  validateCategory,
  categoryController.createCategory
);

// ✅ FRONTEND FORM: Update existing category
router.put('/admin/categories/:id', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  validateCategoryUpdate,
  categoryController.updateCategory
);

// ✅ FRONTEND BUTTON: Delete category
router.delete('/admin/categories/:id', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  categoryController.deleteCategory
);

// ========== ADMIN AUTHOR MANAGEMENT ==========

// ✅ FRONTEND NEEDS: Author management for dropdown populate
router.get('/admin/authors', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  authorController.getAllAuthors
); // Get authors for form dropdowns

// ✅ FRONTEND FORM: Create new author
router.post('/admin/authors', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  validateAuthor,
  authorController.createAuthor
);

// ✅ FRONTEND FORM: Update existing author
router.put('/admin/authors/:id', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  validateAuthorUpdate,
  authorController.updateAuthor
);

// ✅ FRONTEND BUTTON: Delete author
router.delete('/admin/authors/:id', 
  AuthMiddleware.isAuthorized, 
  AuthMiddleware.hasRole(['admin']), 
  authorController.deleteAuthor
);

export default router;