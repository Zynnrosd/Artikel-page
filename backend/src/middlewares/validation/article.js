import Joi from 'joi';
import { HttpError } from '../../utils/error.js';

// ✅ FRONTEND-COMPATIBLE: Article validation schema
const articleSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(255)
    .required()
    .messages({
      'string.base': 'Judul artikel harus berupa teks',
      'string.empty': 'Judul artikel tidak boleh kosong',
      'string.min': 'Judul artikel minimal 3 karakter',
      'string.max': 'Judul artikel maksimal 255 karakter',
      'any.required': 'Judul artikel wajib diisi'
    }),
  
  content: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.base': 'Isi artikel harus berupa teks',
      'string.empty': 'Isi artikel tidak boleh kosong',
      'string.min': 'Isi artikel minimal 10 karakter',
      'any.required': 'Isi artikel wajib diisi'
    }),

  // ✅ FRONTEND SENDS: 'category' field
  category: Joi.string()
    .required()
    .messages({
      'string.base': 'Kategori harus berupa teks',
      'string.empty': 'Kategori tidak boleh kosong',
      'any.required': 'Kategori wajib dipilih'
    }),

  // ✅ FRONTEND SENDS: 'author' field
  author: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.base': 'Nama penulis harus berupa teks',
      'string.empty': 'Nama penulis tidak boleh kosong',
      'string.min': 'Nama penulis minimal 2 karakter',
      'string.max': 'Nama penulis maksimal 255 karakter',
      'any.required': 'Nama penulis wajib diisi'
    })
});

// ✅ CATEGORY validation schema
const categorySchema = Joi.object({
  nama_kategori: Joi.string()
    .min(2)
    .max(191)
    .required()
    .messages({
      'string.base': 'Nama kategori harus berupa teks',
      'string.empty': 'Nama kategori tidak boleh kosong',
      'string.min': 'Nama kategori minimal 2 karakter',
      'string.max': 'Nama kategori maksimal 191 karakter',
      'any.required': 'Nama kategori wajib diisi'
    })
});

// ✅ AUTHOR validation schema
const authorSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.base': 'Nama author harus berupa teks',
      'string.empty': 'Nama author tidak boleh kosong',
      'string.min': 'Nama author minimal 2 karakter',
      'string.max': 'Nama author maksimal 255 karakter',
      'any.required': 'Nama author wajib diisi'
    })
});

// Update validation schemas (optional fields untuk update)
const articleUpdateSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(255)
    .optional()
    .messages({
      'string.base': 'Judul artikel harus berupa teks',
      'string.min': 'Judul artikel minimal 3 karakter',
      'string.max': 'Judul artikel maksimal 255 karakter'
    }),
  
  content: Joi.string()
    .min(10)
    .optional()
    .messages({
      'string.base': 'Isi artikel harus berupa teks',
      'string.min': 'Isi artikel minimal 10 karakter'
    }),

  category: Joi.string()
    .optional()
    .messages({
      'string.base': 'Kategori harus berupa teks'
    }),

  author: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .messages({
      'string.base': 'Nama penulis harus berupa teks',
      'string.min': 'Nama penulis minimal 2 karakter',
      'string.max': 'Nama penulis maksimal 255 karakter'
    }),

  status: Joi.string()
    .valid('published', 'draft')
    .optional()
    .messages({
      'string.base': 'Status artikel harus berupa teks',
      'any.only': 'Status artikel harus published atau draft'
    })
});

const categoryUpdateSchema = Joi.object({
  nama_kategori: Joi.string()
    .min(2)
    .max(191)
    .optional()
    .messages({
      'string.base': 'Nama kategori harus berupa teks',
      'string.min': 'Nama kategori minimal 2 karakter',
      'string.max': 'Nama kategori maksimal 191 karakter'
    })
});

const authorUpdateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .messages({
      'string.base': 'Nama author harus berupa teks',
      'string.min': 'Nama author minimal 2 karakter',
      'string.max': 'Nama author maksimal 255 karakter'
    })
});

// Helper function to preprocess form data
const preprocessFormData = (body) => {
  const processed = {};
  
  // Clean up keys and values
  Object.keys(body).forEach(key => {
    const cleanKey = key.trim();
    let value = body[key];
    
    // Trim whitespace from string fields
    if (typeof value === 'string') {
      value = value.trim();
      
      // Convert empty strings to null for optional fields
      if (value === '') {
        value = null;
      }
    }
    
    processed[cleanKey] = value;
  });
  
  return processed;
};

// ✅ FRONTEND-COMPATIBLE: Validation middleware for articles (CREATE)
export const validateArticle = (req, res, next) => {
  console.log('=== ARTICLE CREATE VALIDATION DEBUG ===');
  console.log('Original req.body:', req.body);
  console.log('Content-Type:', req.headers['content-type']);
  
  // Preprocess form data
  const processedBody = preprocessFormData(req.body);
  console.log('Processed body:', processedBody);
  
  // Update req.body with processed data
  req.body = processedBody;
  
  // ✅ VALIDATE: Required fields that frontend should send
  if (!req.body.title || req.body.title.trim() === '') {
    return next(new HttpError('Judul artikel tidak boleh kosong', 400));
  }
  
  if (!req.body.content || req.body.content.trim() === '') {
    return next(new HttpError('Isi artikel tidak boleh kosong', 400));
  }
  
  if (!req.body.category || req.body.category.trim() === '') {
    return next(new HttpError('Kategori tidak boleh kosong', 400));
  }
  
  if (!req.body.author || req.body.author.trim() === '') {
    return next(new HttpError('Nama penulis tidak boleh kosong', 400));
  }
  
  // ✅ VALIDATE: Image is required for create (frontend should handle this too)
  if (!req.file) {
    return next(new HttpError('Gambar utama wajib diupload', 400));
  }
  
  const { error } = articleSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    console.log('Validation error details:', error.details);
    return next(new HttpError(errorMessage, 400));
  }

  console.log('Article validation passed!');
  next();
};

// ✅ FRONTEND-COMPATIBLE: Validation middleware for articles (UPDATE)
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
    return next(new HttpError(errorMessage, 400));
  }

  console.log('Article update validation passed!');
  next();
};

// ✅ FRONTEND-COMPATIBLE: Validation middleware for categories (CREATE)
export const validateCategory = (req, res, next) => {
  console.log('=== CATEGORY CREATE VALIDATION DEBUG ===');
  console.log('Original req.body:', req.body);
  
  // Preprocess form data
  const processedBody = preprocessFormData(req.body);
  console.log('Processed body:', processedBody);
  
  // Update req.body with processed data
  req.body = processedBody;
  
  // ✅ FRONTEND COMPATIBILITY: Accept both 'name' and 'nama_kategori'
  if (req.body.name && !req.body.nama_kategori) {
    req.body.nama_kategori = req.body.name;
  }
  
  if (!req.body.nama_kategori || req.body.nama_kategori.trim() === '') {
    return next(new HttpError('Nama kategori tidak boleh kosong', 400));
  }
  
  const { error } = categorySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    console.log('Category validation error details:', error.details);
    return next(new HttpError(errorMessage, 400));
  }

  console.log('Category validation passed!');
  next();
};

// ✅ FRONTEND-COMPATIBLE: Validation middleware for categories (UPDATE)
export const validateCategoryUpdate = (req, res, next) => {
  console.log('=== CATEGORY UPDATE VALIDATION DEBUG ===');
  console.log('Original req.body:', req.body);
  
  // Preprocess form data
  const processedBody = preprocessFormData(req.body);
  console.log('Processed body:', processedBody);
  
  // Update req.body with processed data
  req.body = processedBody;
  
  // ✅ FRONTEND COMPATIBILITY: Accept both 'name' and 'nama_kategori'
  if (req.body.name && !req.body.nama_kategori) {
    req.body.nama_kategori = req.body.name;
  }
  
  const { error } = categoryUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    console.log('Category update validation error:', error.details);
    return next(new HttpError(errorMessage, 400));
  }

  console.log('Category update validation passed!');
  next();
};

// ✅ NEW: Validation middleware for authors (CREATE)
export const validateAuthor = (req, res, next) => {
  console.log('=== AUTHOR CREATE VALIDATION DEBUG ===');
  console.log('Original req.body:', req.body);
  
  // Preprocess form data
  const processedBody = preprocessFormData(req.body);
  console.log('Processed body:', processedBody);
  
  // Update req.body with processed data
  req.body = processedBody;
  
  if (!req.body.name || req.body.name.trim() === '') {
    return next(new HttpError('Nama author tidak boleh kosong', 400));
  }
  
  const { error } = authorSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    console.log('Author validation error details:', error.details);
    return next(new HttpError(errorMessage, 400));
  }

  console.log('Author validation passed!');
  next();
};

// ✅ NEW: Validation middleware for authors (UPDATE)
export const validateAuthorUpdate = (req, res, next) => {
  console.log('=== AUTHOR UPDATE VALIDATION DEBUG ===');
  console.log('Original req.body:', req.body);
  
  // Preprocess form data
  const processedBody = preprocessFormData(req.body);
  console.log('Processed body:', processedBody);
  
  // Update req.body with processed data
  req.body = processedBody;
  
  const { error } = authorUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    console.log('Author update validation error:', error.details);
    return next(new HttpError(errorMessage, 400));
  }

  console.log('Author update validation passed!');
  next();
};