# Contributing to Transcribio

Thank you for considering contributing to Transcribio! We welcome contributions from the community.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/junaidh-junu/transcribio.git
   cd transcribio
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up API Key**
   ```bash
   node bin/transcribio.js config --set-key
   ```

## Project Structure

```
transcribio/
├── bin/                  # CLI entry point
├── src/
│   ├── cli/             # CLI commands and utilities
│   ├── core/            # Core transcription logic
│   ├── exporters/       # Export format handlers
│   ├── web/             # Web server and UI
│   └── config/          # Configuration management
└── tests/               # Test files
```

## Development Workflow

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic

3. **Test Your Changes**
   ```bash
   # Run lint
   npm run lint

   # Test CLI
   node bin/transcribio.js test-audio.mp3

   # Test Web UI
   node bin/transcribio.js ui
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `test:` Adding tests
   - `chore:` Maintenance tasks

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a Pull Request on GitHub.

## Code Style

- Use ES6+ features
- Use 2 spaces for indentation
- Use single quotes for strings
- Add JSDoc comments for functions
- Keep functions small and focused

## Testing

We use Vitest for testing:

```bash
npm test
```

Example test:
```javascript
import { describe, it, expect } from 'vitest';
import { toTxt } from '../src/exporters/txt.js';

describe('TXT Exporter', () => {
  it('should export full text', () => {
    const result = { fullText: 'Hello world' };
    expect(toTxt(result)).toBe('Hello world');
  });
});
```

## Adding New Features

### Adding a New Export Format

1. Create `src/exporters/yourformat.js`:
   ```javascript
   export function toYourFormat(result) {
     // Implementation
     return formattedOutput;
   }
   ```

2. Update `src/exporters/index.js`:
   ```javascript
   import { toYourFormat } from './yourformat.js';
   // Add to switch statement
   ```

3. Add tests in `tests/exporters.test.js`

### Adding a New CLI Command

1. Create `src/cli/commands/yourcommand.js`:
   ```javascript
   export async function yourCommand(options) {
     // Implementation
   }
   ```

2. Register in `src/cli/index.js`:
   ```javascript
   program
     .command('yourcommand')
     .description('Description')
     .action(yourCommand);
   ```

## Reporting Issues

When reporting issues, please include:
- Transcribio version (`transcribio --version`)
- Node.js version (`node --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

## Questions?

Feel free to:
- Open an issue for discussion
- Ask questions in pull requests
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
