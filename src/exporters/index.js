import { toTxt } from './txt.js';
import { toSRT } from './srt.js';
import { toVTT } from './vtt.js';
import { toJSON } from './json.js';

export function exportTranscript(result, format) {
  switch (format.toLowerCase()) {
  case 'txt':
    return toTxt(result);
  case 'srt':
    return toSRT(result);
  case 'vtt':
    return toVTT(result);
  case 'json':
    return toJSON(result);
  default:
    throw new Error(`Unsupported format: ${format}`);
  }
}
