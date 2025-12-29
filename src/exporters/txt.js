export function toTxt(result) {
  if (result.fullText) {
    return result.fullText;
  }

  if (!result.segments || !result.segments.length) {
    return '';
  }

  return result.segments
    .map(seg => {
      let line = '';
      if (seg.timestamp) line += `[${seg.timestamp}] `;
      if (seg.speaker) line += `${seg.speaker}: `;
      line += seg.text;
      return line;
    })
    .join('\n\n');
}
