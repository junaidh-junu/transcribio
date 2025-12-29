import Conf from 'conf';
import crypto from 'crypto';

// Simple encryption for API key storage
const ENCRYPTION_KEY = 'transcribio-local-key-2024';

function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encrypted) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

const config = new Conf({
  projectName: 'transcribio',
  schema: {
    apiKey: { type: 'string', default: '' },
    defaultModel: { type: 'string', default: 'flash' },
    defaultFormat: { type: 'string', default: 'txt' },
    speakersDefault: { type: 'boolean', default: true },
    timestampsDefault: { type: 'boolean', default: true }
  }
});

export const configStore = {
  /**
   * Get the Gemini API key
   */
  getApiKey() {
    const encrypted = config.get('apiKey');
    if (!encrypted) return null;
    return decrypt(encrypted);
  },

  /**
   * Set the Gemini API key
   */
  setApiKey(key) {
    const encrypted = encrypt(key);
    config.set('apiKey', encrypted);
  },

  /**
   * Check if API key is configured
   */
  hasApiKey() {
    return !!this.getApiKey();
  },

  /**
   * Get a config value
   */
  get(key) {
    return config.get(key);
  },

  /**
   * Set a config value
   */
  set(key, value) {
    config.set(key, value);
  },

  /**
   * Reset all configuration
   */
  reset() {
    config.clear();
  },

  /**
   * Get config file path (for display)
   */
  getPath() {
    return config.path;
  }
};
