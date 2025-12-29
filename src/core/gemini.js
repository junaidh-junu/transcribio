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
    this.maxRetries = 3;
    this.baseRetryDelay = 1000; // 1 second
  }

  /**
   * Parse error to extract retry delay from API error response
   */
  parseRetryDelay(error) {
    try {
      // Check if error has details array with RetryInfo
      if (error.details && Array.isArray(error.details)) {
        for (const detail of error.details) {
          if (detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' && detail.retryDelay) {
            // Parse duration string like "16s" or "16.205297162s"
            const durationStr = detail.retryDelay;
            const seconds = parseFloat(durationStr.replace('s', ''));
            return Math.ceil(seconds * 1000); // Convert to milliseconds
          }
        }
      }
      
      // Check error message for retry delay hint
      const retryMatch = error.message?.match(/Please retry in ([\d.]+)s/i);
      if (retryMatch) {
        return Math.ceil(parseFloat(retryMatch[1]) * 1000);
      }
    } catch (e) {
      // If parsing fails, return null to use default exponential backoff
    }
    return null;
  }

  /**
   * Check if error is a rate limit/quota error (429)
   */
  isRateLimitError(error) {
    if (!error) return false;
    
    const statusCode = error.status || error.code;
    if (statusCode === 429) return true;
    
    const message = error.message || '';
    return message.includes('429') || 
           message.includes('Too Many Requests') || 
           message.includes('quota') || 
           message.includes('Quota exceeded') ||
           message.includes('rate limit');
  }

  /**
   * Create user-friendly error message for rate limit errors
   */
  createRateLimitErrorMessage(error) {
    const message = error.message || '';
    
    if (message.includes('quota') || message.includes('Quota exceeded')) {
      return 'API quota exceeded. You have reached your usage limit for the Gemini API.\n' +
             'Please check your billing and usage at: https://ai.dev/usage?tab=rate-limit\n' +
             'For more information: https://ai.google.dev/gemini-api/docs/rate-limits';
    }
    
    return 'Rate limit exceeded. The API is temporarily unavailable due to too many requests.\n' +
           'The request will be retried automatically.';
  }

  /**
   * Retry wrapper with exponential backoff for rate limit errors
   */
  async retryWithBackoff(fn, context = '') {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[GeminiService] Retrying ${context} (attempt ${attempt + 1}/${this.maxRetries + 1})`);
        }
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Log the error
        const errorType = this.isRateLimitError(error) ? 'Rate Limit' : 'Error';
        console.error(`[GeminiService] ${errorType} in ${context}:`, error.message || error);
        
        // Only retry on rate limit errors
        if (!this.isRateLimitError(error)) {
          throw error;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === this.maxRetries) {
          console.error(`[GeminiService] Max retries (${this.maxRetries + 1}) reached for ${context}`);
          const friendlyMessage = this.createRateLimitErrorMessage(error);
          const rateLimitError = new Error(friendlyMessage);
          rateLimitError.originalError = error;
          throw rateLimitError;
        }
        
        // Calculate retry delay
        let delay = this.parseRetryDelay(error);
        const delaySource = delay ? 'API suggested' : 'exponential backoff';
        if (!delay) {
          // Use exponential backoff: 1s, 2s, 4s
          delay = this.baseRetryDelay * Math.pow(2, attempt);
        }
        
        // Add jitter to prevent thundering herd (0-20% randomness)
        const jitter = Math.random() * 0.2 * delay;
        delay = Math.ceil(delay + jitter);
        
        console.log(`[GeminiService] Rate limit hit, waiting ${(delay / 1000).toFixed(2)}s (${delaySource}) before retry...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Should never reach here, but just in case
    throw lastError;
  }

  /**
   * Get model name from shorthand
   */
  getModelName(shorthand) {
    const models = {
      'flash-lite': 'gemini-2.5-flash-lite',
      'lite': 'gemini-2.5-flash-lite',
      'flash': 'gemini-2.5-flash',
      'flash-3': 'gemini-3-flash',
      'flash3': 'gemini-3-flash',
      'pro': 'gemini-1.5-pro-latest' // Keep pro for backward compatibility
    };
    return models[shorthand] || models['flash-lite']; // Default to Flash Lite
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
## Transcription Quality:
- Remove unnecessary filler words and hesitations (such as "uh", "um", "er") while preserving natural speech flow
- Fix obvious transcription errors and improve unclear phrasing for better readability
- Correct grammatical mistakes that result from speech-to-text errors
- Ensure the transcribed text makes sense and reads naturally
- Add paragraph breaks at natural points: topic changes, longer pauses, or logical content divisions
- Maintain all meaningful content and preserve the speaker's intent
- Produce clean, readable transcriptions while keeping the full content intact

`;
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
- In "fullText", use paragraph breaks (double newlines) to separate major topics or sections for better readability
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
      model = 'flash-lite'
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

    console.log(`[GeminiService] Starting transcription:`);
    console.log(`[GeminiService]   File: ${path.basename(filePath)} (${fileSizeMB.toFixed(2)} MB)`);
    console.log(`[GeminiService]   Model: ${modelName}`);
    console.log(`[GeminiService]   MIME: ${mimeType}`);
    console.log(`[GeminiService]   Method: ${fileSizeMB > 20 ? 'File API (large file)' : 'Inline base64'}`);

    // Build prompt
    const prompt = this.buildPrompt({ speakers, timestamps, language, translateTo });

    let response;

    try {
      if (fileSizeMB > 20) {
        // Use File API for large files
        console.log(`[GeminiService] Using File API for large file`);
        response = await this.transcribeLargeFile(filePath, mimeType, modelName, prompt);
      } else {
        // Use inline data for smaller files
        console.log(`[GeminiService] Using inline base64 encoding`);
        response = await this.transcribeInline(filePath, mimeType, modelName, prompt);
      }
      console.log(`[GeminiService] Transcription completed successfully`);
      return response;
    } catch (error) {
      console.error(`[GeminiService] Transcription failed:`, error.message);
      throw error;
    }
  }

  /**
   * Transcribe using inline base64 data (files < 20MB)
   */
  async transcribeInline(filePath, mimeType, modelName, prompt) {
    console.log(`[GeminiService] Reading file and encoding to base64...`);
    const audioBuffer = fs.readFileSync(filePath);
    const base64Audio = audioBuffer.toString('base64');
    console.log(`[GeminiService] File encoded, size: ${(base64Audio.length / 1024).toFixed(2)} KB`);

    const model = this.client.getGenerativeModel({ model: modelName });
    console.log(`[GeminiService] Calling generateContent API...`);

    const result = await this.retryWithBackoff(async () => {
      return await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio
          }
        },
        prompt
      ]);
    }, 'transcribeInline');

    console.log(`[GeminiService] API response received, parsing...`);
    return this.parseResponse(result.response);
  }

  /**
   * Transcribe using File API (files > 20MB)
   */
  async transcribeLargeFile(filePath, mimeType, modelName, prompt) {
    const fileManager = this.client.fileManager;

    console.log(`[GeminiService] Uploading file to Gemini File API...`);
    // Upload file with retry logic
    const uploadResult = await this.retryWithBackoff(async () => {
      return await fileManager.uploadFile(filePath, {
        mimeType: mimeType,
        displayName: path.basename(filePath)
      });
    }, 'fileUpload');

    let file = uploadResult.file;
    console.log(`[GeminiService] File uploaded, URI: ${file.uri}`);
    console.log(`[GeminiService] Waiting for file processing (state: ${file.state})...`);

    // Wait for processing
    let pollCount = 0;
    while (file.state === 'PROCESSING') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      file = await fileManager.getFile(file.name);
      pollCount++;
      if (pollCount % 5 === 0) {
        console.log(`[GeminiService] Still processing... (poll ${pollCount})`);
      }
    }

    console.log(`[GeminiService] File processing complete, state: ${file.state}`);

    if (file.state === 'FAILED') {
      throw new Error('File processing failed on Gemini servers');
    }

    // Generate content
    const model = this.client.getGenerativeModel({ model: modelName });
    console.log(`[GeminiService] Calling generateContent API with file URI...`);

    const result = await this.retryWithBackoff(async () => {
      return await model.generateContent([
        {
          fileData: {
            mimeType: file.mimeType,
            fileUri: file.uri
          }
        },
        prompt
      ]);
    }, 'transcribeLargeFile');

    console.log(`[GeminiService] API response received, parsing...`);
    console.log(`[GeminiService] Cleaning up uploaded file...`);

    // Clean up uploaded file
    try {
      await fileManager.deleteFile(file.name);
      console.log(`[GeminiService] File cleaned up successfully`);
    } catch (e) {
      console.warn(`[GeminiService] Warning: Failed to clean up file:`, e.message);
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
