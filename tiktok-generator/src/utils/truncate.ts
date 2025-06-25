/**
 * Truncates text to a maximum length while preserving complete sentences
 * @param text The text to truncate
 * @param maxLength Maximum length of the resulting text
 */
export default function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Try to find sentence boundaries (., !, ?)
  const sentenceRegex = /[.!?]/;
  let truncated = text.substring(0, maxLength);
  
  // Find the last sentence boundary
  const lastSentenceBoundary = truncated.lastIndexOf(
    truncated.match(sentenceRegex)?.[0] || '.'
  );
  
  if (lastSentenceBoundary > 0) {
    // Truncate at the last sentence boundary
    truncated = truncated.substring(0, lastSentenceBoundary + 1);
  } else {
    // No sentence boundary found, truncate at the last space
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.substring(0, lastSpace) + '...';
    } else {
      // No space found, just hard truncate
      truncated = truncated.substring(0, maxLength - 3) + '...';
    }
  }
  
  return truncated;
}
