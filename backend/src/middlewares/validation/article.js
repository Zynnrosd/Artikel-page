import Joi from 'joi';
import { HttpError } from '../../utils/error.js';

// Article validation schema (custom_author menjadi WAJIB)
const articleSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(255)
    .required()
    .messages({
      'string.base': 'Title must be a string',
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title must not exceed 255 characters',
      'any.required': 'Title is required'
    }),
  
  content: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.base': 'Content must be a string',
      'string.empty': 'Content is required',
      'string.min': 'Content must be at least 10 characters long',
      'any.required': 'Content is required'
    }),

  category_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.base': 'Category ID must be a string',
      'string.uuid': 'Category ID must be a valid UUID',
      'any.required': 'Category ID is required'
    }),

  // ✅ PERUBAHAN: custom_author sekarang WAJIB (required)
  custom_author: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.base': 'Custom author must be a string',
      'string.empty': 'Custom author is required',
      'string.min': 'Custom author must be at least 2 characters long',
      'string.max': 'Custom author must not exceed 255 characters',
      'any.required': 'Custom author is required'
    }),

  is_published: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Published status must be a boolean'
    })
});

// ✅ PERUBAHAN: Category validation schema TANPA custom_author
const categorySchema = Joi.object({
  nama_kategori: Joi.string()
    .min(2)
    .max(191)
    .required()
    .messages({
      'string.base': 'Category name must be a string',
      'string.empty': 'Category name is required',
      'string.min': 'Category name must be at least 2 characters long',
      'string.max': 'Category name must not exceed 191 characters',
      'any.required': 'Category name is required'
    })
  // custom_author dihapus dari category schema
});

// Update validation schemas (optional fields untuk update)
const articleUpdateSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(255)
    .optional()
    .messages({
      'string.base': 'Title must be a string',
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title must not exceed 255 characters'
    }),
  
  content: Joi.string()
    .min(10)
    .optional()
    .messages({
      'string.base': 'Content must be a string',
      'string.min': 'Content must be at least 10 characters long'
    }),

  category_id: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.base': 'Category ID must be a string',
      'string.uuid': 'Category ID must be a valid UUID'
    }),

  // ✅ PERUBAHAN: custom_author tetap bisa diupdate tapi tidak boleh kosong
  custom_author: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .messages({
      'string.base': 'Custom author must be a string',
      'string.min': 'Custom author must be at least 2 characters long',
      'string.max': 'Custom author must not exceed 255 characters'
    }),

  is_published: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Published status must be a boolean'
    })
});

// ✅ PERUBAHAN: Category update schema TANPA custom_author
const categoryUpdateSchema = Joi.object({
  nama_kategori: Joi.string()
    .min(2)
    .max(191)
    .optional()
    .messages({
      'string.base': 'Category name must be a string',
      'string.min': 'Category name must be at least 2 characters long',
      'string.max': 'Category name must not exceed 191 characters'
    })
  // custom_author dihapus dari category update schema
});

// Helper function to preprocess form data
const preprocessFormData = (body) => {
  const processed = {};
  
  // Clean up keys and values
  Object.keys(body).forEach(key => {
    const cleanKey = key.trim();
    let value = body[key];
    
    // Convert string 'true'/'false' to boolean for is_published
    if (cleanKey === 'is_published' && value !== undefined) {
      if (typeof value === 'string') {
        value = value.toLowerCase() === 'true';
      }
    }
    
    // Trim whitespace from string fields
    if (typeof value === 'string') {
      value = value.trim();
      
      // ✅ PERUBAHAN: custom_author tidak boleh empty string lagi
      // Hanya convert empty string to null untuk field yang optional
      if (value === '' && !['custom_author'].includes(cleanKey)) {
        // Field lain yang optional bisa jadi null, tapi custom_author tidak boleh
        value = null;
      }
    }
    
    processed[cleanKey] = value;
  });
  
  return processed;
};

// Validation middleware for articles (CREATE)
export const validateArticle = (req, res, next) => {
  console.log('=== VALIDATION DEBUG ===');
  console.log('Original req.body:', req.body);
  console.log('Content-Type:', req.headers['content-type']);
  
  // Preprocess form data
  const processedBody = preprocessFormData(req.body);
  console.log('Processed body:', processedBody);
  
  // Update req.body with processed data
  req.body = processedBody;
  
  console.log('Final req.body for validation:', req.body);
  console.log('req.body.title:', req.body.title);
  console.log('req.body.title type:', typeof req.body.title);
  console.log('req.body.title length:', req.body.title?.length);
  console.log('req.body.is_published:', req.body.is_published);
  console.log('req.body.custom_author:', req.body.custom_author);
  
  const { error } = articleSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true // Allow type conversion
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    console.log('Validation error details:', error.details);
    return next(new HttpError(400, { 
      message: errorMessage, 
      errors: error.details 
    }));
  }

  console.log('Validation passed!');
  next();
};

// Validation middleware for articles (UPDATE)
export const validateArticleUpdate = (req, res, next) => {
  console.log('=== ARTICLE UPDATE VALIDATION DEBUG ===');
  console.log('Original req.body:', req.body);
  
  // Preprocess form data
  const processedBody = preprocessFormData(req.body);
  console.log('Processed body:', processedBody);
  
  // Update req.body with processed data
  req.body = processedBody;
  
  const { error } = articleUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    console.log('Article update validation error:', error.details);
    return next(new HttpError(400, { 
      message: errorMessage, 
      errors: error.details 
    }));
  }

  console.log('Article update validation passed!');
  next();
};

// Validation middleware for categories (CREATE)
export const validateCategory = (req, res, next) => {
  console.log('=== CATEGORY VALIDATION DEBUG ===');
  console.log('Original req.body:', req.body);
  
  // Preprocess form data
  const processedBody = preprocessFormData(req.body);
  console.log('Processed body:', processedBody);
  
  // Update req.body with processed data
  req.body = processedBody;
  
  console.log('req.body.nama_kategori:', req.body.nama_kategori);
  // ✅ PERUBAHAN: Tidak ada lagi custom_author untuk category
  
  const { error } = categorySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    console.log('Category validation error details:', error.details);
    return next(new HttpError(400, { 
      message: errorMessage, 
      errors: error.details 
    }));
  }

  console.log('Category validation passed!');
  next();
};

// Validation middleware for categories (UPDATE)
export const validateCategoryUpdate = (req, res, next) => {
  console.log('=== CATEGORY UPDATE VALIDATION DEBUG ===');
  console.log('Original req.body:', req.body);
  
  // Preprocess form data
  const processedBody = preprocessFormData(req.body);
  console.log('Processed body:', processedBody);
  
  // Update req.body with processed data
  req.body = processedBody;
  
  console.log('req.body.nama_kategori:', req.body.nama_kategori);
  // ✅ PERUBAHAN: Tidak ada lagi custom_author untuk category
  
  const { error } = categoryUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    console.log('Category update validation error:', error.details);
    return next(new HttpError(400, { 
      message: errorMessage, 
      errors: error.details 
    }));
  }

  console.log('Category update validation passed!');
  next();
};