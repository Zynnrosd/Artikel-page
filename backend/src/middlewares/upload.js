import multer from 'multer';
import path from 'path';
import fs from 'fs';

const tempDir = path.resolve('public', 'temp');
const uploadsDir = path.resolve('uploads');

[tempDir, uploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024,
    fields: 20,
    fieldSize: 2 * 1024 * 1024,
    files: 1
  }
});

export const moveFileFromTemp = (filename) => {
  if (!filename) return null;

  const tempPath = path.join(tempDir, filename);
  const finalPath = path.join(uploadsDir, filename);

  try {
    if (fs.existsSync(tempPath)) {
      fs.copyFileSync(tempPath, finalPath);
      fs.unlinkSync(tempPath);
      if (fs.existsSync(finalPath)) {
        return filename;
      } else {
        return null;
      }
    } else {
      if (fs.existsSync(finalPath)) {
        return filename;
      }
      return null;
    }
  } catch {
    try {
      if (fs.existsSync(tempPath)) {
        const data = fs.readFileSync(tempPath);
        fs.writeFileSync(finalPath, data);
        fs.unlinkSync(tempPath);
        return filename;
      }
    } catch {
      return null;
    }
    return null;
  }
};

export const cleanupTempFile = (filename) => {
  if (!filename) return;
  const tempPath = path.join(tempDir, filename);
  try {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  } catch {}
};

export const cleanupOldTempFiles = () => {
  try {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAge = 1000 * 60 * 60;
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
      }
    });
  } catch {}
};

export const debugUploadsFolder = () => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      console.error('Uploads directory does not exist:', uploadsDir);
    }
    if (!fs.existsSync(tempDir)) {
      console.error('Temp directory does not exist:', tempDir);
    }
  } catch (error) {
    console.error('Error checking directories:', error.message);
  }
};

setInterval(() => {
  cleanupOldTempFiles();
}, 1000 * 60 * 60);

debugUploadsFolder();
