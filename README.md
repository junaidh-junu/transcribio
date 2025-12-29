# 🎙️ Transcribio

AI-powered audio transcription using Google's Gemini API. Runs locally on your machine with a beautiful CLI and web interface.

![npm version](https://img.shields.io/npm/v/transcribio)
![license](https://img.shields.io/npm/l/transcribio)

## Features

- 🎯 **High Accuracy** - Powered by Gemini 2.0 Flash/Pro
- 🗣️ **Speaker Detection** - Identifies different speakers
- ⏱️ **Timestamps** - Navigation-friendly time markers
- 🌍 **50+ Languages** - Auto-detection or manual selection
- 📤 **Multiple Exports** - TXT, SRT, VTT, JSON
- 💻 **CLI & Web UI** - Use your preferred interface
- 🔒 **Privacy First** - Runs locally, audio goes directly to Gemini
- 💸 **Free** - Uses Gemini's generous free tier

## Installation

```bash
npm install -g transcribio
```

## Quick Start

### 1. Get API Key

Get your free Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey)

### 2. Configure

```bash
transcribio config --set-key
```

### 3. Transcribe

```bash
# Using CLI
transcribio audio.mp3

# Or launch Web UI
transcribio ui
```

## CLI Usage

### Basic Transcription

```bash
# Simple transcription
transcribio interview.mp3

# With specific options
transcribio podcast.wav --speakers --timestamps --output srt

# Save to file
transcribio meeting.m4a -f transcript.txt

# Different model
transcribio audio.mp3 --model pro
```

### Options

| Option                  | Description                    | Default |
| ----------------------- | ------------------------------ | ------- |
| `-s, --speakers`        | Enable speaker detection       | true    |
| `-t, --timestamps`      | Include timestamps             | true    |
| `-l, --language <code>` | Audio language (or 'auto')     | auto    |
| `-o, --output <format>` | Format: txt, srt, vtt, json    | txt     |
| `-f, --file <path>`     | Save output to file            | -       |
| `--model <name>`        | flash (fast) or pro (accurate) | flash   |
| `--translate <lang>`    | Translate to language          | -       |

### Configuration Commands

```bash
# Set API key interactively
transcribio config --set-key

# Show current configuration
transcribio config --show

# Reset all settings
transcribio config --reset
```

## Web Interface

Launch the web UI for a more visual experience:

```bash
transcribio ui
```

This opens a browser at `http://localhost:3456` with:

- Drag & drop file upload
- Real-time progress
- Multiple export formats
- Beautiful formatted output

Custom port:

```bash
transcribio ui --port 8080
```

## Supported Formats

### Input Audio

- MP3 (`.mp3`)
- WAV (`.wav`)
- M4A (`.m4a`)
- OGG (`.ogg`)
- FLAC (`.flac`)
- AAC (`.aac`)
- WebM (`.webm`)

### Output Formats

#### TXT (Plain Text)

```
[00:00] Speaker 1: Hello, welcome to the podcast.
[00:05] Speaker 2: Thanks for having me!
```

#### SRT (SubRip Subtitle)

```
1
00:00:00,000 --> 00:00:05,000
[Speaker 1] Hello, welcome to the podcast.

2
00:00:05,000 --> 00:00:08,000
[Speaker 2] Thanks for having me!
```

#### VTT (WebVTT)

```
WEBVTT

1
00:00:00.000 --> 00:00:05.000
<v Speaker 1>Hello, welcome to the podcast.

2
00:00:05.000 --> 00:00:08.000
<v Speaker 2>Thanks for having me!
```

#### JSON

```json
{
  "success": true,
  "language": "English",
  "languageCode": "en",
  "duration": "05:30",
  "segments": [
    {
      "timestamp": "00:00",
      "speaker": "Speaker 1",
      "text": "Hello, welcome to the podcast."
    }
  ],
  "fullText": "Complete transcript...",
  "summary": "Brief summary of the content"
}
```

## Examples

### Transcribe Interview

```bash
transcribio interview.mp3 --speakers --timestamps -f interview.txt
```

### Create Subtitles

```bash
transcribio video-audio.wav --output srt -f subtitles.srt
```

### Translate Content

```bash
transcribio spanish-audio.mp3 --translate english
```

### High Accuracy Mode

```bash
transcribio important-meeting.m4a --model pro --output json -f meeting.json
```

## API Usage (Programmatic)

Use Transcribio in your Node.js projects:

```javascript
import { GeminiService, exportTranscript } from "transcribio";

// Initialize with API key
const gemini = new GeminiService("your-api-key");

// Transcribe audio
const result = await gemini.transcribe("audio.mp3", {
  speakers: true,
  timestamps: true,
  language: "auto",
  model: "flash",
});

// Export to different formats
const txt = exportTranscript(result, "txt");
const srt = exportTranscript(result, "srt");
const vtt = exportTranscript(result, "vtt");
const json = exportTranscript(result, "json");

console.log(result);
```

## Free Tier Limits

Gemini's free tier is generous:

| Model | Daily Requests | Speed  | Accuracy  |
| ----- | -------------- | ------ | --------- |
| Flash | ~1,000/day     | Fast   | Good      |
| Pro   | ~50/day        | Slower | Excellent |

Perfect for personal use, podcasts, interviews, and more!

## Privacy & Security

- 🏠 **Runs locally** - No data stored on external servers
- 🔑 **API key encrypted** - Stored securely on your machine
- 🔒 **Direct to Gemini** - Audio sent only to Google's Gemini API
- 📝 **No tracking** - Zero analytics or telemetry

## Troubleshooting

### API Key Issues

```bash
# Check if key is configured
transcribio config --show

# Reset and reconfigure
transcribio config --reset
transcribio config --set-key
```

### File Size Issues

- Files under 20MB: Sent inline (faster)
- Files over 20MB: Use File API (slower but handles larger files)
- Maximum: 100MB

### Unsupported Format

Convert your audio file to a supported format:

```bash
# Using ffmpeg
ffmpeg -i input.mp4 -vn -acodec libmp3lame output.mp3
```

## Development

### Clone & Install

```bash
git clone https://github.com/junaidh-junu/transcribio.git
cd transcribio
npm install
```

### Run Locally

```bash
# CLI
node bin/transcribio.js audio.mp3

# Web UI
node bin/transcribio.js ui
```

### Run Tests

```bash
npm test
```

### Lint Code

```bash
npm run lint
```

## Project Structure

```
transcribio/
├── bin/
│   └── transcribio.js           # CLI entry point
├── src/
│   ├── cli/                     # CLI implementation
│   ├── core/                    # Gemini service
│   ├── exporters/               # Format exporters
│   ├── web/                     # Web UI & server
│   └── config/                  # Configuration management
├── tests/                       # Test files
└── package.json
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

### v2.0.0

- [ ] Batch processing (transcribe multiple files)
- [ ] YouTube URL support
- [ ] Word-level timestamps
- [ ] Custom vocabulary support

### v3.0.0

- [ ] Real-time transcription
- [ ] Desktop app (Electron)
- [ ] Offline mode with local Whisper

## License

MIT © Junaidh Haneefa

## Links

- [GitHub Repository](https://github.com/junaidh-junu/transcribio)
- [NPM Package](https://www.npmjs.com/package/transcribio)
- [Get Gemini API Key](https://aistudio.google.com/apikey)
- [Report Issues](https://github.com/junaidh-junu/transcribio/issues)

## Acknowledgments

- Built with [Google Gemini AI](https://ai.google.dev/)
- Inspired by the need for free, privacy-focused transcription tools

---

Made with ❤️ by developers, for developers
