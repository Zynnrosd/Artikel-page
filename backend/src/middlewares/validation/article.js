import Joi from 'joi';
import { HttpError } from '../../utils/error.js';

const articleSchema = Joi.object({
  title: Joi.string().min(3).max(255).required().messages({
    'string.base': 'Judul artikel harus berupa teks',
    'string.empty': 'Judul artikel tidak boleh kosong',
    'string.min': 'Judul artikel minimal 3 karakter',
    'string.max': 'Judul artikel maksimal 255 karakter',
    'any.required': 'Judul artikel wajib diisi'
  }),
  content: Joi.string().min(10).required().messages({
    'string.base': 'Isi artikel harus berupa teks',
    'string.empty': 'Isi artikel tidak boleh kosong',
    'string.min': 'Isi artikel minimal 10 karakter',
    'any.required': 'Isi artikel wajib diisi'
  }),
  category: Joi.string().required().messages({
    'string.base': 'Kategori harus berupa teks',
    'string.empty': 'Kategori tidak boleh kosong',
    'any.required': 'Kategori wajib dipilih'
  }),
  author: Joi.string().min(2).max(255).required().messages({
    'string.base': 'Nama penulis harus berupa teks',
    'string.empty': 'Nama penulis tidak boleh kosong',
    'string.min': 'Nama penulis minimal 2 karakter',
    'string.max': 'Nama penulis maksimal 255 karakter',
    'any.required': 'Nama penulis wajib diisi'
  })
});

const categorySchema = Joi.object({
  nama_kategori: Joi.string().min(2).max(191).required().messages({
    'string.base': 'Nama kategori harus berupa teks',
    'string.empty': 'Nama kategori tidak boleh kosong',
    'string.min': 'Nama kategori minimal 2 karakter',
    'string.max': 'Nama kategori maksimal 191 karakter',
    'any.required': 'Nama kategori wajib diisi'
  })
});

const authorSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.base': 'Nama author harus berupa teks',
    'string.empty': 'Nama author tidak boleh kosong',
    'string.min': 'Nama author minimal 2 karakter',
    'string.max': 'Nama author maksimal 255 karakter',
    'any.required': 'Nama author wajib diisi'
  })
});

const articleUpdateSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional().messages({
    'string.base': 'Judul artikel harus berupa teks',
    'string.min': 'Judul artikel minimal 3 karakter',
    'string.max': 'Judul artikel maksimal 255 karakter'
  }),
  content: Joi.string().min(10).optional().messages({
    'string.base': 'Isi artikel harus berupa teks',
    'string.min': 'Isi artikel minimal 10 karakter'
  }),
  category: Joi.string().optional().messages({
    'string.base': 'Kategori harus berupa teks'
  }),
  author: Joi.string().min(2).max(255).optional().messages({
    'string.base': 'Nama penulis harus berupa teks',
    'string.min': 'Nama penulis minimal 2 karakter',
    'string.max': 'Nama penulis maksimal 255 karakter'
  }),
  status: Joi.string().valid('published', 'draft').optional().messages({
    'string.base': 'Status artikel harus berupa teks',
    'any.only': 'Status artikel harus published atau draft'
  })
});

const categoryUpdateSchema = Joi.object({
  nama_kategori: Joi.string().min(2).max(191).optional().messages({
    'string.base': 'Nama kategori harus berupa teks',
    'string.min': 'Nama kategori minimal 2 karakter',
    'string.max': 'Nama kategori maksimal 191 karakter'
  })
});

const authorUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional().messages({
    'string.base': 'Nama author harus berupa teks',
    'string.min': 'Nama author minimal 2 karakter',
    'string.max': 'Nama author maksimal 255 karakter'
  })
});

const preprocessFormData = (body) => {
  const processed = {};
  Object.keys(body).forEach(key => {
    const cleanKey = key.trim();
    let value = body[key];
    if (typeof value === 'string') {
      value = value.trim();
      if (value === '') {
        value = null;
      }
    }
    processed[cleanKey] = value;
  });
  return processed;
};

export const validateArticle = (req, res, next) => {
  const processedBody = preprocessFormData(req.body);
  req.body = processedBody;

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
    return next(new HttpError(errorMessage, 400));
  }
  next();
};

export const validateArticleUpdate = (req, res, next) => {
  const processedBody = preprocessFormData(req.body);
  req.body = processedBody;

  const { error } = articleUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return next(new HttpError(errorMessage, 400));
  }
  next();
};

export const validateCategory = (req, res, next) => {
  const processedBody = preprocessFormData(req.body);
  req.body = processedBody;

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
    return next(new HttpError(errorMessage, 400));
  }
  next();
};

export const validateCategoryUpdate = (req, res, next) => {
  const processedBody = preprocessFormData(req.body);
  req.body = processedBody;

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
    return next(new HttpError(errorMessage, 400));
  }
  next();
};

export const validateAuthor = (req, res, next) => {
  const processedBody = preprocessFormData(req.body);
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
    return next(new HttpError(errorMessage, 400));
  }
  next();
};

export const validateAuthorUpdate = (req, res, next) => {
  const processedBody = preprocessFormData(req.body);
  req.body = processedBody;

  const { error } = authorUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return next(new HttpError(errorMessage, 400));
  }
  next();
};
