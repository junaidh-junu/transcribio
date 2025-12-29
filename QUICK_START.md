# 🚀 Quick Start Guide - Transcribio

Get started with Transcribio in under 2 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy your API key

## 3. Configure Transcribio

```bash
node bin/transcribio.js config --set-key
```

Paste your API key when prompted.

## 4. Test the CLI

### Option A: Transcribe a sample audio file

```bash
# If you have an audio file
node bin/transcribio.js path/to/your/audio.mp3
```

### Option B: Launch the Web UI

```bash
node bin/transcribio.js ui
```

This will open your browser at `http://localhost:3456` where you can drag & drop audio files.

## 5. Try Different Options

```bash
# Create subtitles (SRT format)
node bin/transcribio.js audio.mp3 --output srt -f subtitles.srt

# High accuracy mode
node bin/transcribio.js audio.mp3 --model pro

# Disable speaker detection
node bin/transcribio.js audio.mp3 --no-speakers

# Save as JSON
node bin/transcribio.js audio.mp3 --output json -f transcript.json
```

## Testing Without Audio Files

If you don't have audio files to test:

1. **Record a quick voice memo** on your phone
2. **Download a podcast episode** snippet
3. **Use text-to-speech** to create a test file:
   - macOS: `say "Hello world, this is a test" -o test.aiff`
   - Convert to MP3 with online tools

## Common Commands

```bash
# Show version
node bin/transcribio.js --version

# Show help
node bin/transcribio.js --help

# Show config
node bin/transcribio.js config --show

# Launch web UI on different port
node bin/transcribio.js ui --port 8080
```

## Next Steps

1. Read the full [README.md](README.md) for all features
2. Check [CONTRIBUTING.md](CONTRIBUTING.md) if you want to contribute
3. Test different audio formats (MP3, WAV, M4A, etc.)
4. Try the translation feature (`--translate spanish`)
5. Experiment with different models (flash vs pro)

## Publishing to NPM (When Ready)

1. Update `package.json` with your GitHub username
2. Login to NPM: `npm login`
3. Publish: `npm publish`

## Need Help?

- Run `node bin/transcribio.js --help`
- Check the [README.md](README.md)
- Open an issue on GitHub

---

Happy transcribing! 🎙️
