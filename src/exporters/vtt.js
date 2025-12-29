export function toVTT(result) {
  if (!result.segments || !result.segments.length) {
    return 'WEBVTT\n\n';
  }

  let vtt = 'WEBVTT\n\n';

  vtt += result.segments
    .map((seg, index) => {
      const startTime = parseTimestamp(seg.timestamp);
      const endTime = calculateEndTime(startTime, seg.text);
      const text = seg.speaker ? `<v ${seg.speaker}>${seg.text}` : seg.text;

      return [
        `${index + 1}`,
        `${formatVTTTime(startTime)} --> ${formatVTTTime(endTime)}`,
        text,
        ''
      ].join('\n');
    })
    .join('\n');

  return vtt;
}

function parseTimestamp(timestamp) {
  if (!timestamp) return 0;
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function calculateEndTime(startSeconds, text) {
  const wordsPerSecond = 2.5;
  const wordCount = text.split(/\s+/).length;
  const duration = Math.max(2, Math.ceil(wordCount / wordsPerSecond));
  return startSeconds + duration;
}

function formatVTTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':') + '.' + ms.toString().padStart(3, '0');
}
