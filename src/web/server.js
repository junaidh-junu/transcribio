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

export function startServer(port = 3456) {
  return new Promise((resolve, reject) => {
    const app = express();

    app.use(express.json());

    // Serve static files
    app.use(express.static(path.join(__dirname, 'public')));

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // Transcription endpoint
    app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No audio file uploaded' });
      }

      try {
        const options = {
          speakers: req.body.speakers !== 'false',
          timestamps: req.body.timestamps !== 'false',
          language: req.body.language || 'auto',
          translateTo: req.body.translateTo || null,
          model: req.body.model || 'flash'
        };

        const gemini = new GeminiService();
        const result = await gemini.transcribe(req.file.path, options);

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        res.json(result);
      } catch (error) {
        // Clean up temp file on error
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
      }
    });

    // Export endpoint
    app.post('/api/export', (req, res) => {
      const { transcript, format } = req.body;

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
        res.send(output);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Start server
    const server = app.listen(port, () => {
      resolve(server);
    });

    server.on('error', (error) => {
      reject(error);
    });
  });
}
