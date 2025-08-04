import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Buat folder temp (konsisten dengan kode lama)
const tempDir = path.resolve('public', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log('Created temp directory:', tempDir);
}

// Pastikan folder uploads juga ada (untuk move file nanti)
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Upload ke temp folder dulu (sesuai kode lama)
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('Original filename:', file.originalname);
    console.log('Generated filename:', filename);
    console.log('Temp destination:', tempDir);
    console.log('Full temp path:', path.join(tempDir, filename));
    
    cb(null, filename);
  }
});

// File filter untuk validasi image
const fileFilter = (req, file, cb) => {
  console.log('=== FILE FILTER DEBUG ===');
  console.log('File details:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });

  if (file.mimetype.startsWith('image/')) {
    console.log('File accepted: valid image type');
    cb(null, true);
  } else {
    console.log('File rejected: not an image type');
    cb(new Error('Only image files are allowed!'), false);
  }
};

export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,    // 5MB max file size
    fields: 20,                   // Max text fields
    fieldSize: 2 * 1024 * 1024,   // 2MB max field size
    files: 1                      // Max 1 file upload
  }
});

// Helper function untuk move file dari temp ke uploads
export const moveFileFromTemp = (filename) => {
  if (!filename) return null;
  
  const tempPath = path.join(tempDir, filename);
  const finalPath = path.join(uploadsDir, filename);
  
  try {
    if (fs.existsSync(tempPath)) {
      // Move file dari temp ke uploads
      fs.renameSync(tempPath, finalPath);
      console.log(`File moved from temp to uploads: ${filename}`);
      return filename;
    } else {
      console.error('Temp file not found:', tempPath);
      return null;
    }
  } catch (error) {
    console.error('Error moving file from temp:', error.message);
    return null;
  }
};

// Helper function untuk cleanup temp files
export const cleanupTempFile = (filename) => {
  if (!filename) return;
  
  const tempPath = path.join(tempDir, filename);
  
  try {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
      console.log(`Temp file cleaned up: ${filename}`);
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error.message);
  }
};