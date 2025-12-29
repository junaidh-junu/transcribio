import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { configStore } from '../config/store.js';

export class GeminiService {
  constructor(apiKey = null) {
    const key = apiKey || configStore.getApiKey();
    if (!key) {
      throw new Error('No API key configured. Run: transcribio config --set-key');
    }
    this.client = new GoogleGenerativeAI(key);
  }

  /**
   * Get model name from shorthand
   */
  getModelName(shorthand) {
    const models = {
      flash: 'gemini-2.0-flash-exp',
      pro: 'gemini-1.5-pro'
    };
    return models[shorthand] || models.flash;
  }

  /**
   * Get MIME type from file extension
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.ogg': 'audio/ogg',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac',
      '.aiff': 'audio/aiff',
      '.weba': 'audio/webm',
      '.webm': 'audio/webm'
    };
    return mimeTypes[ext] || 'audio/mpeg';
  }

  /**
   * Build transcription prompt
   */
  buildPrompt(options) {
    const { speakers, timestamps, language, translateTo } = options;

    let prompt = `You are a professional transcription assistant. Transcribe this audio file with high accuracy.

## Instructions:
`;

    if (speakers) {
      prompt += `- Identify different speakers and label them (Speaker 1, Speaker 2, or use names if identifiable from context)
`;
    }

    if (timestamps) {
      prompt += `- Include timestamps in MM:SS format at the start of each segment or when speakers change
`;
    }

    if (language && language !== 'auto') {
      prompt += `- The audio is in ${language}. Transcribe in this language.
`;
    } else {
      prompt += `- Automatically detect the language and transcribe in the original language
`;
    }

    if (translateTo) {
      prompt += `- After transcription, provide a translation to ${translateTo}
`;
    }

    prompt += `
## Output Format:
Return ONLY a valid JSON object (no markdown, no code blocks) with this structure:

{
  "success": true,
  "language": "detected language name",
  "languageCode": "ISO 639-1 code",
  "duration": "MM:SS",
  "segments": [
    {
      "timestamp": "00:00",
      "speaker": "Speaker 1",
      "text": "transcribed text"
    }
  ],
  "fullText": "complete transcript as continuous text",
  "translation": "translated text if requested, otherwise null",
  "summary": "2-3 sentence summary of the content"
}

Important:
- Ensure valid JSON with properly escaped characters
- Be accurate with punctuation and formatting
- Segment naturally by speaker changes or logical breaks
- Timestamps should be approximate but useful for navigation`;

    return prompt;
  }

  /**
   * Transcribe audio file
   */
  async transcribe(filePath, options = {}) {
    const {
      speakers = true,
      timestamps = true,
      language = 'auto',
      translateTo = null,
      model = 'flash'
    } = options;

    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file info
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    const mimeType = this.getMimeType(filePath);
    const modelName = this.getModelName(model);

    // Build prompt
    const prompt = this.buildPrompt({ speakers, timestamps, language, translateTo });

    let response;

    if (fileSizeMB > 20) {
      // Use File API for large files
      response = await this.transcribeLargeFile(filePath, mimeType, modelName, prompt);
    } else {
      // Use inline data for smaller files
      response = await this.transcribeInline(filePath, mimeType, modelName, prompt);
    }

    return response;
  }

  /**
   * Transcribe using inline base64 data (files < 20MB)
   */
  async transcribeInline(filePath, mimeType, modelName, prompt) {
    const audioBuffer = fs.readFileSync(filePath);
    const base64Audio = audioBuffer.toString('base64');

    const model = this.client.getGenerativeModel({ model: modelName });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Audio
        }
      },
      prompt
    ]);

    return this.parseResponse(result.response);
  }

  /**
   * Transcribe using File API (files > 20MB)
   */
  async transcribeLargeFile(filePath, mimeType, modelName, prompt) {
    const fileManager = this.client.fileManager;

    // Upload file
    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType: mimeType,
      displayName: path.basename(filePath)
    });

    let file = uploadResult.file;

    // Wait for processing
    while (file.state === 'PROCESSING') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      file = await fileManager.getFile(file.name);
    }

    if (file.state === 'FAILED') {
      throw new Error('File processing failed on Gemini servers');
    }

    // Generate content
    const model = this.client.getGenerativeModel({ model: modelName });

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: file.mimeType,
          fileUri: file.uri
        }
      },
      prompt
    ]);

    // Clean up uploaded file
    try {
      await fileManager.deleteFile(file.name);
    } catch (e) {
      // Ignore cleanup errors
    }

    return this.parseResponse(result.response);
  }

  /**
   * Parse Gemini response
   */
  parseResponse(response) {
    const text = response.text();

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    // Clean up response (remove markdown code blocks if present)
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.slice(7);
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.slice(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3);
    }
    cleanText = cleanText.trim();

    try {
      return JSON.parse(cleanText);
    } catch (e) {
      // If JSON parsing fails, return structured error with raw text
      return {
        success: false,
        error: 'Failed to parse response',
        rawText: text,
        fullText: text
      };
    }
  }
}

export default GeminiService;
