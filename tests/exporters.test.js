import { describe, it, expect } from 'vitest';
import { toTxt } from '../src/exporters/txt.js';
import { toSRT } from '../src/exporters/srt.js';
import { toVTT } from '../src/exporters/vtt.js';
import { toJSON } from '../src/exporters/json.js';
import { exportTranscript } from '../src/exporters/index.js';

describe('TXT Exporter', () => {
  it('should export full text when available', () => {
    const result = { fullText: 'Hello world' };
    expect(toTxt(result)).toBe('Hello world');
  });

  it('should export segments with timestamps and speakers', () => {
    const result = {
      segments: [
        { timestamp: '00:00', speaker: 'Speaker 1', text: 'Hello' },
        { timestamp: '00:05', speaker: 'Speaker 2', text: 'Hi there' }
      ]
    };
    const output = toTxt(result);
    expect(output).toContain('[00:00]');
    expect(output).toContain('Speaker 1:');
    expect(output).toContain('Hello');
  });

  it('should return empty string for empty result', () => {
    const result = { segments: [] };
    expect(toTxt(result)).toBe('');
  });
});

describe('SRT Exporter', () => {
  it('should generate valid SRT format', () => {
    const result = {
      segments: [
        { timestamp: '00:00', speaker: 'Speaker 1', text: 'Hello world' }
      ]
    };
    const output = toSRT(result);
    expect(output).toContain('1\n');
    expect(output).toContain('-->');
    expect(output).toContain('[Speaker 1] Hello world');
  });

  it('should return empty string for empty segments', () => {
    const result = { segments: [] };
    expect(toSRT(result)).toBe('');
  });
});

describe('VTT Exporter', () => {
  it('should start with WEBVTT header', () => {
    const result = { segments: [] };
    const output = toVTT(result);
    expect(output).toContain('WEBVTT');
  });

  it('should use voice tags for speakers', () => {
    const result = {
      segments: [
        { timestamp: '00:00', speaker: 'John', text: 'Hello' }
      ]
    };
    const output = toVTT(result);
    expect(output).toContain('<v John>');
  });
});

describe('JSON Exporter', () => {
  it('should return valid JSON string', () => {
    const result = { success: true, fullText: 'Test' };
    const output = toJSON(result);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('should preserve all data', () => {
    const result = { success: true, language: 'en', fullText: 'Test' };
    const output = JSON.parse(toJSON(result));
    expect(output.success).toBe(true);
    expect(output.language).toBe('en');
    expect(output.fullText).toBe('Test');
  });
});

describe('Export Router', () => {
  it('should route to correct exporter', () => {
    const result = { fullText: 'Test' };

    expect(exportTranscript(result, 'txt')).toBe('Test');
    expect(exportTranscript(result, 'TXT')).toBe('Test');
    expect(exportTranscript(result, 'json')).toContain('"fullText"');
  });

  it('should throw error for unsupported format', () => {
    const result = { fullText: 'Test' };
    expect(() => exportTranscript(result, 'invalid')).toThrow('Unsupported format');
  });
});
