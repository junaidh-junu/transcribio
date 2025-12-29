import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import { GeminiService } from '../core/gemini.js';
import { exportTranscript } from '../exporters/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for temp uploads
const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'transcribio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/webm'];
    if (validTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'));
    }
  }
});

/**
 * Log request information
 */
function logRequest(req, message = '') {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;
  console.log(`[Server] ${timestamp} ${method} ${path} ${message ? '- ' + message : ''} (${ip})`);
}

/**
 * Log error information
 */
function logError(error, context = '') {
  const timestamp = new Date().toISOString();
  console.error(`[Server] ${timestamp} ERROR ${context ? `[${context}]` : ''}:`, error.message || error);
  if (error.stack) {
    console.error(`[Server] Stack:`, error.stack);
  }
}

export function startServer(port = 3456) {
  return new Promise((resolve, reject) => {
    const app = express();

    // Request logging middleware
    app.use((req, res, next) => {
      logRequest(req);
      next();
    });

    app.use(express.json());

    // Serve static files
    app.use(express.static(path.join(__dirname, 'public')));

    // Health check
    app.get('/api/health', (req, res) => {
      logRequest(req, 'Health check');
      res.json({ status: 'ok' });
    });

    // Transcription endpoint
    app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
      const startTime = Date.now();
      
      if (!req.file) {
        logError(new Error('No audio file uploaded'), 'transcribe');
        return res.status(400).json({ error: 'No audio file uploaded' });
      }

      const fileName = req.file.originalname || 'unknown';
      const fileSize = (req.file.size / (1024 * 1024)).toFixed(2);
      logRequest(req, `Transcription request - File: ${fileName} (${fileSize} MB)`);

      try {
        const options = {
          speakers: req.body.speakers !== 'false',
          timestamps: req.body.timestamps !== 'false',
          language: req.body.language || 'auto',
          translateTo: req.body.translateTo || null,
          model: req.body.model || 'lite'
        };

        console.log(`[Server] Transcription options:`, options);
        console.log(`[Server] Initializing Gemini service...`);

        const gemini = new GeminiService();
        const result = await gemini.transcribe(req.file.path, options);

        // Clean up temp file
        fs.unlinkSync(req.file.path);
        console.log(`[Server] Temp file cleaned up: ${req.file.path}`);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[Server] Transcription completed successfully in ${elapsed}s`);
        logRequest(req, `SUCCESS - ${elapsed}s`);

        res.json(result);
      } catch (error) {
        // Clean up temp file on error
        if (req.file?.path && fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
            console.log(`[Server] Temp file cleaned up after error: ${req.file.path}`);
          } catch (cleanupError) {
            logError(cleanupError, 'cleanup');
          }
        }
        
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        
        // Handle rate limit errors with appropriate status code
        const isRateLimit = error.message?.includes('quota') || 
                           error.message?.includes('Rate limit') ||
                           error.originalError?.status === 429;
        
        const statusCode = isRateLimit ? 429 : 500;
        
        logError(error, `transcribe - ${statusCode} - ${elapsed}s`);
        
        if (isRateLimit) {
          console.log(`[Server] Rate limit error detected, returning 429 status`);
        }
        
        res.status(statusCode).json({ 
          error: error.message,
          ...(isRateLimit && {
            type: 'rate_limit',
            links: {
              usage: 'https://ai.dev/usage?tab=rate-limit',
              docs: 'https://ai.google.dev/gemini-api/docs/rate-limits'
            }
          })
        });
      }
    });

    // Export endpoint
    app.post('/api/export', (req, res) => {
      const { transcript, format } = req.body;

      logRequest(req, `Export request - Format: ${format || 'unknown'}`);

      try {
        const output = exportTranscript(transcript, format);

        const contentTypes = {
          txt: 'text/plain',
          srt: 'application/x-subrip',
          vtt: 'text/vtt',
          json: 'application/json'
        };

        res.setHeader('Content-Type', contentTypes[format] || 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="transcript.${format}"`);
        
        console.log(`[Server] Export completed successfully - Format: ${format}`);
        logRequest(req, `SUCCESS - Export ${format}`);
        
        res.send(output);
      } catch (error) {
        logError(error, 'export');
        res.status(400).json({ error: error.message });
      }
    });

    // Start server
    const server = app.listen(port, () => {
      const timestamp = new Date().toISOString();
      console.log(`[Server] ${timestamp} Server started on port ${port}`);
      console.log(`[Server] Web UI available at: http://localhost:${port}`);
      resolve(server);
    });

    server.on('error', (error) => {
      logError(error, 'server startup');
      reject(error);
    });
  });
}
