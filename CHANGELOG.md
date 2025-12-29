# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-29

### Added
- Initial release
- CLI interface for audio transcription
- Web UI for browser-based transcription
- Support for MP3, WAV, M4A, OGG, FLAC, AAC, WebM formats
- Speaker detection and diarization
- Timestamp generation
- Multi-language support with auto-detection
- Export to TXT, SRT, VTT, JSON formats
- Gemini Flash and Pro model support
- Secure API key storage
- Interactive configuration management
- File size optimization (inline for <20MB, File API for >20MB)
- Automatic summary generation
- Translation support

### Features
- Real-time progress indicators
- Drag & drop file upload in web UI
- Multiple export format downloads
- Copy to clipboard functionality
- Beautiful CLI with colored output
- Responsive web design

### Security
- Encrypted API key storage
- Local-only processing
- No telemetry or tracking
