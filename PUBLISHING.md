# 📦 Publishing Transcribio to NPM

Complete guide to publishing your package to NPM.

## Pre-Publishing Checklist

### 1. Update package.json

```json
{
  "name": "transcribio",
  "version": "1.0.0",
  "description": "AI-powered audio transcription using Gemini - CLI & Web UI",
  "author": "Junaidh Haneefa",
  "repository": {
    "type": "git",
    "url": "https://github.com/junaidh-junu/transcribio.git"
  },
  "homepage": "https://github.com/junaidh-junu/transcribio#readme",
  "bugs": {
    "url": "https://github.com/junaidh-junu/transcribio/issues"
  }
}
```

### 2. Check Package Name Availability

```bash
npm search transcribio
```

If taken, choose a different name like:

- `@yourname/transcribio`
- `transcribio-ai`
- `gemini-transcribe`

### 3. Test Locally

```bash
# Install dependencies
npm install

# Run tests
npm test

# Test CLI
node bin/transcribio.js --help

# Test transcription (with your API key set)
node bin/transcribio.js test-audio.mp3

# Test Web UI
node bin/transcribio.js ui
```

### 4. Update Documentation

- [ ] Update README.md with correct GitHub URLs
- [ ] Add screenshots/GIFs to README
- [ ] Update CHANGELOG.md with release notes
- [ ] Verify LICENSE file has correct year and name

### 5. Create GitHub Repository

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit: Transcribio v1.0.0"

# Create repo on GitHub, then:
git remote add origin https://github.com/junaidh-junu/transcribio.git
git branch -M main
git push -u origin main
```

### 6. Add GitHub Topics

On your GitHub repo, add topics:

- `transcription`
- `audio`
- `gemini`
- `ai`
- `cli`
- `nodejs`
- `npm-package`

## Publishing Steps

### 1. Create NPM Account

Visit [npmjs.com/signup](https://www.npmjs.com/signup) and create an account.

### 2. Enable Two-Factor Authentication (Required for Publishing)

**Important:** NPM requires 2FA or a granular access token to publish packages.

#### Option A: Enable 2FA on your NPM account

1. Visit [npmjs.com/settings/security](https://www.npmjs.com/settings/security)
2. Click "Enable 2FA" under "Two-Factor Authentication"
3. Choose your preferred method:
   - **Authenticator App** (recommended): Use Google Authenticator, Authy, or similar
   - **SMS**: Receive codes via text message
4. Follow the setup instructions
5. Save your backup codes in a secure location

#### Option B: Create a Granular Access Token (Alternative)

If you prefer not to enable 2FA, create a granular access token:

1. Visit [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
2. Click "Generate New Token"
3. Select "Granular Access Token"
4. Configure:
   - **Token name**: e.g., "transcribio-publish"
   - **Expiration**: Choose appropriate duration
   - **Permissions**: Select "Publish" with "Bypass 2FA" enabled
5. Copy the token (you won't see it again!)
6. Use it for authentication:

```bash
npm login --auth-type=legacy
# When prompted for password, paste your token instead
```

### 3. Login to NPM

```bash
npm login
```

Enter your:

- Username
- Password
- Email
- One-time password (if 2FA enabled)

### 4. Verify Login

```bash
npm whoami
```

Should display your NPM username.

### 5. Test Package

```bash
# Dry run (doesn't actually publish)
npm publish --dry-run
```

Check the output to ensure all files are included correctly.

### 6. Publish

```bash
npm publish
```

**First time publishing?** You might need to verify your email first.

### 7. Verify Publication

Visit `https://www.npmjs.com/package/transcribio` (or your package name).

### 8. Test Installation

```bash
# In a different directory
npm install -g transcribio

# Test it
transcribio --version
transcribio --help
```

## Post-Publishing

### 1. Add NPM Badge to README

```markdown
![npm version](https://img.shields.io/npm/v/transcribio)
![npm downloads](https://img.shields.io/npm/dm/transcribio)
![license](https://img.shields.io/npm/l/transcribio)
```

### 2. Create a Release on GitHub

1. Go to your repo → Releases → Create a new release
2. Tag: `v1.0.0`
3. Title: `v1.0.0 - Initial Release`
4. Description: Copy from CHANGELOG.md

### 3. Share Your Package

- Tweet about it
- Post on Reddit (r/javascript, r/node)
- Share on LinkedIn
- Add to your portfolio

## Updating Published Package

### Version Bump

```bash
# Patch (1.0.0 → 1.0.1) - Bug fixes
npm version patch

# Minor (1.0.0 → 1.1.0) - New features
npm version minor

# Major (1.0.0 → 2.0.0) - Breaking changes
npm version major
```

This automatically:

- Updates package.json version
- Creates a git commit
- Creates a git tag

### Publish Update

```bash
git push && git push --tags
npm publish
```

### Update CHANGELOG.md

```markdown
## [1.0.1] - 2024-12-30

### Fixed

- Bug in audio file validation
- Improved error messages

### Added

- Support for AAC audio format
```

## Common Issues

### "Package name already exists"

Use a scoped package:

```bash
npm publish --access public
```

Or choose a different name in package.json.

### "You must verify your email"

Check your email and click the verification link from NPM.

### "Payment required"

For scoped packages (`@username/package`), you need:

```bash
npm publish --access public
```

### "402 Payment Required"

Your package name might be reserved. Choose a different name.

### "403 Forbidden - Two-factor authentication or granular access token required"

This error occurs when trying to publish without 2FA enabled or without a proper access token.

**Solution:**

1. **Enable 2FA** (recommended):

   - Visit [npmjs.com/settings/security](https://www.npmjs.com/settings/security)
   - Enable 2FA using an authenticator app or SMS
   - Log out and log back in: `npm logout && npm login`
   - Try publishing again

2. **Or use a Granular Access Token**:
   - Visit [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
   - Generate a new "Granular Access Token" with "Publish" permission and "Bypass 2FA" enabled
   - Use the token as your password when logging in:
     ```bash
     npm logout
     npm login --auth-type=legacy
     # Username: your-username
     # Password: <paste your token>
     # Email: your-email@example.com
     ```
   - Try publishing again

**Note:** NPM requires 2FA or granular access tokens for all package publishing to enhance security.

## Best Practices

1. **Semantic Versioning**

   - MAJOR: Breaking changes
   - MINOR: New features (backward compatible)
   - PATCH: Bug fixes

2. **Keep README Updated**

   - Clear installation instructions
   - Usage examples
   - Screenshots/GIFs
   - API documentation

3. **Maintain CHANGELOG**

   - Document all changes
   - Follow [Keep a Changelog](https://keepachangelog.com/)

4. **Use Git Tags**

   - Tag each release
   - Makes rollback easier
   - Better version tracking

5. **Test Before Publishing**
   - Run `npm test`
   - Test in fresh directory
   - Check all features work

## Resources

- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Choose a License](https://choosealicense.com/)

## Success! 🎉

Once published, your package will be:

- Installable via `npm install -g transcribio`
- Searchable on npmjs.com
- Available to millions of developers
- Part of your public portfolio

Remember to:

- ⭐ Star repos that inspired you
- 📝 Credit contributors
- 🐛 Fix bugs quickly
- 💡 Accept feature requests gracefully
- 📢 Promote your work!

---

Good luck with your package! 🚀
