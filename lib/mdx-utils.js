/**
 * Utility functions for handling MDX content with JSON frontmatter
 */

/**
 * Extract frontmatter from MDX content
 * Primarily supports JSON frontmatter, with basic fallback for legacy YAML
 * @param {string} content - The MDX content including frontmatter
 * @returns {{frontmatter: Object, content: string}} An object with frontmatter and content properties
 */
export function extractFrontmatter(content) {
  if (!content) return { frontmatter: {}, content: '' };

  // Handle JSON frontmatter (primary method)
  if (content.startsWith('---json')) {
    const jsonFrontmatterRegex = /---json\n([\s\S]*?)\n---/;
    const match = content.match(jsonFrontmatterRegex);
    
    if (match && match[1]) {
      try {
        const frontmatter = JSON.parse(match[1]);
        const contentWithoutFrontmatter = content.replace(jsonFrontmatterRegex, '').trim();
        return { frontmatter, content: contentWithoutFrontmatter };
      } catch (error) {
        console.error('Error parsing JSON frontmatter:', error);
        return { frontmatter: {}, content };
      }
    }
  }
  
  // Simple fallback for YAML frontmatter (legacy support)
  // This is a basic implementation without gray-matter dependency
  if (content.startsWith('---\n')) {
    try {
      const yamlFrontmatterRegex = /---\n([\s\S]*?)\n---/;
      const match = content.match(yamlFrontmatterRegex);
      
      if (match && match[1]) {
        // Simple YAML-like parsing - convert to key-value pairs
        const frontmatterLines = match[1].split('\n');
        const frontmatter = {};
        
        frontmatterLines.forEach(line => {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            frontmatter[key] = value;
          }
        });
        
        const contentWithoutFrontmatter = content.replace(yamlFrontmatterRegex, '').trim();
        return { frontmatter, content: contentWithoutFrontmatter };
      }
    } catch (error) {
      console.error('Error parsing YAML frontmatter:', error);
    }
  }
  
  // If all else fails, return the original content
  return { frontmatter: {}, content };
}

/**
 * Safe wrapper for MDX content that might have frontmatter
 * This prevents frontmatter from being treated as part of the content
 * @param {string} content - The MDX content including frontmatter
 * @returns {string} The cleaned content without frontmatter
 */
export function preprocessMDX(content) {
  if (!content) return '';

  try {
    // Try to use our extractFrontmatter function first
    const { content: processedContent } = extractFrontmatter(content);
    if (processedContent) {
      return processedContent;
    }
  } catch (error) {
    console.error('Error in preprocessMDX:', error);
  }

  // Fallback: manually strip frontmatter if extraction fails
  if (content.startsWith('---')) {
    const parts = content.split('---');
    if (parts.length >= 3) {
      // Join everything after the second '---'
      return parts.slice(2).join('---').trim();
    }
  }
  
  // Return original content if all else fails
  return content;
}
