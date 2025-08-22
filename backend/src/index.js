import express from 'express';
import { createServer } from 'http';
import loaders from './loaders/index.js';
import routes from './routes/index.js';
import errorMiddleware from './middlewares/error.js';
import { appEnv } from './utils/env.js';
import { logger } from './loaders/pino.js';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const app = express();
  const server = createServer(app);

  if (appEnv.NODE_ENV === 'development') {
    const { default: monitor } = await import('express-status-monitor');
    app.use(monitor());
  }

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  const uploadsPath = path.resolve(__dirname, '../uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  app.use('/uploads', express.static(uploadsPath, {
    maxAge: '1d',
    etag: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.gif')) {
        res.setHeader('Content-Type', 'image/gif');
      } else if (filePath.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }));

  app.use(express.static(path.resolve(__dirname, '../public')));

  app.use(morgan('dev', {
    skip: (req) => req.url.startsWith('/uploads') || req.url.includes('.')
  }));

  loaders(app, server);
  routes(app);

  app.get('/dashboardadmin*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
  });

  app.get('/auth', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
  });

  app.get('/artikel*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
  });

  app.get('/uploads/*', (req, res) => {
    const requestedFile = req.params[0];
    const filePath = path.join(uploadsPath, requestedFile);

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    const tempPath = path.resolve(__dirname, '../public/temp', requestedFile);
    if (fs.existsSync(tempPath)) {
      try {
        fs.renameSync(tempPath, filePath);
        return res.sendFile(filePath);
      } catch {
        return res.status(404).json({ error: 'File not found' });
      }
    }

    return res.status(404).json({
      error: 'Image not found',
      requested: requestedFile,
      message: 'The requested image file does not exist'
    });
  });

  app.get('*', (req, res, next) => {
    if (req.path.includes('.')) return next();
    if (
      req.path.startsWith('/auth') ||
      req.path.startsWith('/users') ||
      req.path.startsWith('/notification') ||
      req.path.startsWith('/docs') ||
      req.path.startsWith('/status') ||
      req.path.startsWith('/packages') ||
      req.path.startsWith('/classes') ||
      req.path.startsWith('/attendance') ||
      req.path.startsWith('/orders') ||
      req.path.startsWith('/apply') ||
      req.path.startsWith('/salaries') ||
      req.path.startsWith('/articles') ||
      req.path.startsWith('/categories') ||
      req.path.startsWith('/authors') ||
      req.path.startsWith('/uploads')
    ) return next();

    res.sendFile(path.resolve(__dirname, '../public/index.html'));
  });

  errorMiddleware(app);

  server.listen(appEnv.PORT, () => {
    logger.info(`Server running on http://localhost:${appEnv.PORT}`);
    if (appEnv.NODE_ENV === 'development') {
      logger.info(`Status monitor at http://localhost:${appEnv.PORT}/status`);
    }
  });

  server.on('error', (err) => {
    logger.error(`Server failed to start: ${err.message}`);
    process.exit(1);
  });
}

function handleExit(signal) {
  logger.info(`Caught ${signal}, shutting down gracefully.`);
  logger.flush();
  process.exit(0);
}

process.on('SIGTERM', handleExit);
process.on('SIGINT', handleExit);

main();
