# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Transcribio** is an NPM CLI tool for AI-powered audio transcription using Google's Gemini API. It provides both a CLI interface and a web UI for transcribing audio files with speaker detection, timestamps, and multiple export formats (TXT, SRT, VTT, JSON).

## Essential Commands

### Development
```bash
# Run CLI locally
node bin/transcribio.js <audio-file>

# Launch web UI locally
node bin/transcribio.js ui

# Run with options
node bin/transcribio.js audio.mp3 --speakers --timestamps --output srt
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest tests/exporters.test.js
```

### Linting
```bash
# Lint all code
npm run lint

# ESLint is configured with:
# - 2-space indentation
# - Single quotes for strings
# - Semicolons required
# - ES2021 + Node.js environment
```

### Configuration Management
```bash
# Set API key
node bin/transcribio.js config --set-key

# Show current configuration
node bin/transcribio.js config --show

# Reset configuration
node bin/transcribio.js config --reset
```

## Architecture

### Core Components

**GeminiService** (`src/core/gemini.js`)
- Main service for interacting with Google Gemini API
- Handles two transcription modes:
  - **Inline mode**: For files < 20MB (faster, base64 encoding)
  - **File API mode**: For files > 20MB (slower, uses Gemini File API)
- Builds structured prompts for transcription with options for speakers, timestamps, language detection, and translation
- Returns structured JSON responses with segments, full text, language info, and summary

**CLI Interface** (`src/cli/index.js`)
- Uses Commander.js for command parsing
- Three main commands: transcribe (default), config, ui
- Commands are organized in `src/cli/commands/`

**Exporters** (`src/exporters/`)
- Modular export system for different formats
- Each format has its own module: txt.js, srt.js, vtt.js, json.js
- Central `exportTranscript()` function routes to appropriate exporter

**Config Store** (`src/config/store.js`)
- Uses `conf` package for cross-platform config storage
- API keys are encrypted with AES-256-CBC before storage
- Default settings for model, format, speakers, and timestamps

**Web Server** (`src/web/server.js`)
- Express-based REST API
- Uses Multer for file uploads (100MB limit)
- Two endpoints: `/api/transcribe` and `/api/export`
- Temporary files are automatically cleaned up after processing

### Data Flow

1. **CLI/Web Upload** → Audio file provided
2. **GeminiService** → Determines inline vs File API based on size
3. **Gemini API** → Transcription with structured prompt
4. **Response Parser** → Cleans and parses JSON response
5. **Exporter** → Converts to requested format (TXT/SRT/VTT/JSON)
6. **Output** → Console display or file save

### File Structure
```
transcribio/
├── bin/
│   └── transcribio.js           # CLI entry point (executable)
├── src/
│   ├── cli/
│   │   ├── index.js             # Command registration
│   │   └── commands/            # Command implementations
│   ├── core/
│   │   └── gemini.js            # Core Gemini API service
│   ├── exporters/
│   │   ├── index.js             # Export router
│   │   └── [format].js          # Format-specific exporters
│   ├── web/
│   │   ├── server.js            # Express server
│   │   └── public/              # Web UI assets
│   └── config/
│       └── store.js             # Configuration management
└── tests/
    └── exporters.test.js        # Unit tests
```

## Key Technical Details

### ESM Modules
- Project uses ES modules (`"type": "module"` in package.json)
- All imports must use `.js` extensions
- Use `import.meta.url` and `fileURLToPath` for `__dirname` equivalent

### Supported Audio Formats
MP3, WAV, M4A, OGG, FLAC, AAC, AIFF, WebM (auto-detected via file extension)

### Gemini Models
- `flash` (gemini-2.0-flash-exp): Fast, ~1000 requests/day free
- `pro` (gemini-1.5-pro): Slower but more accurate, ~50 requests/day free

### Response Structure
Gemini returns structured JSON with:
- `success`: boolean status
- `language` and `languageCode`: detected language
- `duration`: audio length in MM:SS
- `segments`: array of {timestamp, speaker, text}
- `fullText`: complete transcript
- `summary`: 2-3 sentence content summary
- `translation`: optional translated text

## Development Guidelines

### Adding New Export Formats
1. Create new file in `src/exporters/yourformat.js`
2. Export function `toYourFormat(result)` that returns formatted string
3. Import and add case to `exporters/index.js`
4. Add tests in `tests/exporters.test.js`

### Adding New CLI Commands
1. Create command file in `src/cli/commands/yourcommand.js`
2. Export async function with `(options)` parameter
3. Register in `src/cli/index.js` using `.command()` and `.action()`

### Testing Strategy
- Use Vitest for unit tests
- Test exporters independently with mock data
- Manual integration testing required for Gemini API (uses real API key)
- CLI tested via `node bin/transcribio.js` (not `npm start`)

### Error Handling
- Always clean up temp files in web server endpoints (use try/finally)
- Provide user-friendly error messages (not raw API errors)
- Gracefully handle JSON parsing failures in `parseResponse()`
- File validation happens before API calls to save quota

## Publishing Workflow

Before publishing to NPM:
1. Run full test suite: `npm test`
2. Lint code: `npm run lint`
3. Test CLI locally: `node bin/transcribio.js --version`
4. Test web UI: `node bin/transcribio.js ui`
5. Manual test with real audio file
6. Verify package contents: `npm pack` and inspect tarball

The `prepublishOnly` script automatically runs tests before publishing.

## Code Style Requirements

- 2-space indentation (enforced by ESLint)
- Single quotes for strings
- Semicolons required
- JSDoc comments for public functions
- Keep functions focused and under 50 lines where possible
- Use destructuring for options objects
- Follow Conventional Commits format (feat:, fix:, docs:, etc.)

## Common Pitfalls

### API Key Storage
- Never log API keys or include them in error messages
- Keys are encrypted in config store but can still be accessed programmatically
- Always check `hasApiKey()` before instantiating GeminiService

### File Size Handling
- The 20MB threshold is critical for choosing transcription mode
- Large files must use File API (includes upload + processing wait)
- Always delete temp files after processing to avoid disk usage issues

### Response Parsing
- Gemini may return markdown-wrapped JSON (```json ... ```)
- Always strip markdown code blocks before parsing
- Have fallback for unparseable responses (return raw text in structured format)

### Web Server Temp Files
- Multer stores uploads in OS temp directory
- Always unlink temp files in both success and error paths
- Use `fs.existsSync()` before unlinking to avoid errors

## Dependencies

### Core
- `@google/generative-ai`: Gemini API client
- `commander`: CLI framework
- `express`: Web server
- `conf`: Cross-platform config storage
- `multer`: File upload handling

### CLI UI
- `chalk`: Terminal colors
- `inquirer`: Interactive prompts
- `ora`: Spinners and progress
- `open`: Browser launching

### Testing
- `vitest`: Test runner
- `eslint`: Linting

## Node.js Version
Minimum: Node.js 18.0.0 (specified in package.json engines)
