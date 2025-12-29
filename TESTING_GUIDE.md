# 🧪 Testing Guide - Transcribio

Comprehensive guide to testing Transcribio before publishing.

## Pre-Testing Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a free API key
3. Save it for testing

## Unit Tests

### Run All Tests
```bash
npm test
```

Expected output:
```
✓ tests/exporters.test.js  (11 tests) 2ms

Test Files  1 passed (1)
     Tests  11 passed (11)
```

### Run with Coverage
```bash
npm run test:coverage
```

### Individual Test Files
```bash
npx vitest tests/exporters.test.js
```

## CLI Testing

### 1. Test Version Command
```bash
node bin/transcribio.js --version
```
Expected: `1.0.0`

### 2. Test Help Command
```bash
node bin/transcribio.js --help
```
Expected: Display help with all commands and options

### 3. Test Config Commands

```bash
# Show current config (empty initially)
node bin/transcribio.js config --show

# Set API key directly
node bin/transcribio.js config --key "YOUR_TEST_API_KEY"

# Verify it was saved
node bin/transcribio.js config --show
# Should show: API Key: Configured ✔

# Show help
node bin/transcribio.js config
```

### 4. Test Transcription (With Real Audio)

**Option A: Use a test audio file**

If you have an MP3 file:
```bash
node bin/transcribio.js path/to/audio.mp3
```

**Option B: Create a test audio file**

macOS:
```bash
say "Hello world, this is a test of the transcription system" -o test.aiff
```

Then test:
```bash
node bin/transcribio.js test.aiff
```

**Option C: Download sample audio**

```bash
# Download a short audio sample (requires curl)
curl -o sample.mp3 "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
node bin/transcribio.js sample.mp3
```

### 5. Test Different Output Formats

```bash
# Plain text (default)
node bin/transcribio.js audio.mp3

# SRT subtitles
node bin/transcribio.js audio.mp3 --output srt

# VTT subtitles
node bin/transcribio.js audio.mp3 --output vtt

# JSON
node bin/transcribio.js audio.mp3 --output json
```

### 6. Test File Output

```bash
# Save to file
node bin/transcribio.js audio.mp3 -f output.txt

# Verify file was created
cat output.txt

# Test different formats
node bin/transcribio.js audio.mp3 -o srt -f subtitles.srt
node bin/transcribio.js audio.mp3 -o json -f data.json
```

### 7. Test Options

```bash
# Disable speakers
node bin/transcribio.js audio.mp3 --no-speakers

# Disable timestamps
node bin/transcribio.js audio.mp3 --no-timestamps

# Specific language
node bin/transcribio.js audio.mp3 --language en

# Use Pro model (slower, more accurate)
node bin/transcribio.js audio.mp3 --model pro

# Combine options
node bin/transcribio.js audio.mp3 --model pro --output srt -f out.srt
```

### 8. Test Error Handling

```bash
# Missing file
node bin/transcribio.js nonexistent.mp3
# Expected: Error message about file not found

# Invalid format
node bin/transcribio.js test.txt
# Expected: Error about unsupported format

# No API key set
node bin/transcribio.js config --reset
node bin/transcribio.js audio.mp3
# Expected: Error about missing API key
```

## Web UI Testing

### 1. Launch Server
```bash
node bin/transcribio.js ui
```

Expected:
- Server starts on port 3456
- Browser opens automatically
- Console shows success message

### 2. Test Web Interface

**Manual Testing Checklist:**

- [ ] Page loads correctly
- [ ] Drag & drop zone is visible
- [ ] Options are displayed
- [ ] Click to upload works
- [ ] Drag & drop works
- [ ] File upload shows processing state
- [ ] Transcription completes successfully
- [ ] Result displays formatted view
- [ ] Can switch between tabs (Formatted/Plain/JSON)
- [ ] Summary displays (if available)
- [ ] Export buttons work (TXT, SRT, VTT, JSON)
- [ ] Copy button works
- [ ] "New Transcription" button resets UI
- [ ] Error handling works (try invalid file)

### 3. Test Different Browsers

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (optional)

### 4. Test Different Ports

```bash
node bin/transcribio.js ui --port 8080
```

Verify server starts on port 8080.

## Integration Testing

### Test Complete Workflow

```bash
# 1. Fresh install
npm install

# 2. Configure
node bin/transcribio.js config --set-key
# Enter API key

# 3. Transcribe
node bin/transcribio.js test-audio.mp3

# 4. Save to file
node bin/transcribio.js test-audio.mp3 -f output.txt

# 5. Different format
node bin/transcribio.js test-audio.mp3 -o srt -f subs.srt

# 6. Launch UI
node bin/transcribio.js ui

# 7. Upload file in UI
# 8. Download different formats
# 9. Verify all downloads work
```

## File Size Testing

### Small Files (<20MB)
```bash
# Should use inline processing (faster)
node bin/transcribio.js small-audio.mp3
```

### Large Files (>20MB)
```bash
# Should use File API (slower)
node bin/transcribio.js large-audio.mp3
```

Watch console for upload progress.

## Edge Cases

### 1. Empty Audio
Test with very short audio (1 second)

### 2. Long Audio
Test with 30+ minute audio file

### 3. Multiple Languages
Test with multilingual audio

### 4. Poor Audio Quality
Test with noisy/low-quality audio

### 5. Different Formats
- [ ] MP3
- [ ] WAV
- [ ] M4A
- [ ] OGG
- [ ] FLAC

## Performance Testing

### Measure Processing Time

```bash
# Time a transcription
time node bin/transcribio.js audio.mp3

# Compare models
time node bin/transcribio.js audio.mp3 --model flash
time node bin/transcribio.js audio.mp3 --model pro
```

Expected:
- Flash: Faster (seconds to minutes)
- Pro: Slower but more accurate

## API Rate Limit Testing

Gemini free tier limits:
- Flash: ~1000 requests/day
- Pro: ~50 requests/day

Test behavior when hitting limits.

## Linting

```bash
npm run lint
```

Expected: No linting errors.

## Package Testing

### Test as Installed Package

```bash
# Pack the package
npm pack

# Install in test directory
mkdir test-install
cd test-install
npm install ../transcribio-1.0.0.tgz

# Test CLI
npx transcribio --version
npx transcribio --help
```

## Automated Test Script

Create `test-all.sh`:

```bash
#!/bin/bash
echo "Running all tests..."

echo "1. Unit tests"
npm test

echo "2. Linting"
npm run lint

echo "3. CLI version"
node bin/transcribio.js --version

echo "4. CLI help"
node bin/transcribio.js --help

echo "5. Config test"
node bin/transcribio.js config --show

echo "All tests complete!"
```

Run:
```bash
chmod +x test-all.sh
./test-all.sh
```

## Test Checklist

### Before Publishing

- [ ] All unit tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] CLI commands work
- [ ] Config management works
- [ ] Transcription works with test audio
- [ ] All export formats work (TXT, SRT, VTT, JSON)
- [ ] Web UI launches successfully
- [ ] File uploads work in UI
- [ ] All UI features function
- [ ] Error messages are clear
- [ ] Documentation is accurate
- [ ] Package.json is correct
- [ ] README has correct info
- [ ] License file exists

### After Publishing

- [ ] Install from NPM (`npm install -g transcribio`)
- [ ] Test global CLI (`transcribio --version`)
- [ ] Verify NPM page looks good
- [ ] Test installation on different OS (optional)

## Troubleshooting Tests

### Tests Fail

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Run tests with verbose output
npm test -- --reporter=verbose
```

### CLI Doesn't Work

```bash
# Check node version
node --version
# Should be >= 18.0.0

# Check permissions
ls -la bin/transcribio.js
# Should be executable

# Make executable if needed
chmod +x bin/transcribio.js
```

### Web UI Issues

```bash
# Check if port is in use
lsof -i :3456

# Try different port
node bin/transcribio.js ui --port 8080
```

### API Key Issues

```bash
# Reset config
node bin/transcribio.js config --reset

# Set new key
node bin/transcribio.js config --set-key

# Verify
node bin/transcribio.js config --show
```

## Test Audio Sources

### Free Test Audio
1. **Your own voice** - Record on phone/computer
2. **Text-to-speech** - Use system TTS
3. **Free music** - [Bensound](https://www.bensound.com)
4. **Podcast clips** - Short segments from podcasts
5. **YouTube audio** - Download with youtube-dl

### Audio Characteristics to Test
- Different lengths (10s, 1min, 5min, 30min)
- Different speakers (1, 2, 3+ speakers)
- Different languages (English, Spanish, etc.)
- Different quality (studio, phone recording)
- Different formats (MP3, WAV, M4A)

## Success Criteria

All tests pass when:
- ✅ Unit tests: 100% pass
- ✅ Linting: No errors
- ✅ CLI: All commands work
- ✅ Transcription: Accurate results
- ✅ Export: All formats valid
- ✅ Web UI: All features work
- ✅ Error handling: Clear messages
- ✅ Documentation: Complete and accurate

---

**Ready to publish?** All tests passing? See [PUBLISHING.md](PUBLISHING.md)
