export class HttpError extends Error {
    constructor(statusCode, { message, errors }) {
      super(message);
      this.errors = errors;
      this.statusCode = statusCode;
    }
  }

  // Fungsi-fungsi baru yang ditambahkan

/**
 * Generate slug from title
 * @param {string} title - The title to convert to slug
 * @returns {string} - Generated slug
 */
export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Validate file type for image upload
 * @param {string} mimetype - File mimetype
 * @returns {boolean} - True if valid image type
 */
export const isValidImageType = (mimetype) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return allowedTypes.includes(mimetype);
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate excerpt from content
 * @param {string} content - Full content
 * @param {number} length - Maximum length of excerpt
 * @returns {string} - Generated excerpt
 */
export const generateExcerpt = (content, length = 200) => {
  // Remove HTML tags if present
  const plainText = content.replace(/<[^>]*>/g, '');
  
  if (plainText.length <= length) {
    return plainText;
  }
  
  return plainText.substring(0, length).trim() + '...';
};