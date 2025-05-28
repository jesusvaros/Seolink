/**
 * MDX Migration Script
 * Converts all MDX files from YAML frontmatter to JSON frontmatter
 * Ensures proper closing delimiters and consistent formatting
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Directory containing MDX files
const POSTS_DIR = path.join(__dirname, '../content/posts');

// Count statistics
let stats = {
  total: 0,
  converted: 0,
  alreadyJson: 0,
  fixed: 0,
  errors: 0
};

/**
 * Convert a YAML frontmatter MDX file to JSON frontmatter
 */
function convertYamlToJsonFrontmatter(filePath) {
  console.log(`Processing: ${path.basename(filePath)}`);
  stats.total++;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already using JSON frontmatter
    if (content.startsWith('---json')) {
      console.log('  Already using JSON frontmatter');
      stats.alreadyJson++;
      
      // Check if it has proper closing delimiter
      if (!content.includes('\n---\n')) {
        const fixed = content.replace(/---json\n([\s\S]*?)\n(import|#)/, '---json\n$1\n---\n\n$2');
        fs.writeFileSync(filePath, fixed);
        console.log('  Fixed missing closing delimiter');
        stats.fixed++;
      }
      return;
    }
    
    // Check if it's using YAML frontmatter
    if (content.startsWith('---')) {
      try {
        // Parse the YAML frontmatter
        const { data, content: mdxContent } = matter(content);
        
        // Convert frontmatter to JSON string
        const jsonFrontmatter = JSON.stringify(data, null, 2);
        
        // Create new MDX content with JSON frontmatter
        const newContent = `---json\n${jsonFrontmatter}\n---\n\n${mdxContent.trim()}`;
        
        // Write the converted file
        fs.writeFileSync(filePath, newContent);
        console.log('  Converted from YAML to JSON frontmatter');
        stats.converted++;
      } catch (error) {
        console.error(`  Error parsing YAML frontmatter: ${error.message}`);
        
        // Try to fix the file by adding a missing closing delimiter
        if (!content.includes('\n---\n')) {
          const fixed = content.replace(/---\n([\s\S]*?)\n(import|#)/, '---\n$1\n---\n\n$2');
          fs.writeFileSync(filePath, fixed);
          console.log('  Fixed missing closing delimiter in YAML frontmatter');
          stats.fixed++;
        } else {
          stats.errors++;
        }
      }
    } else {
      console.error('  File does not have frontmatter');
      stats.errors++;
    }
  } catch (error) {
    console.error(`  Error processing file: ${error.message}`);
    stats.errors++;
  }
}

/**
 * Process all MDX files in the posts directory
 */
function migrateAllMdxFiles() {
  console.log(`Starting migration of MDX files in ${POSTS_DIR}`);
  
  // Get all MDX files
  const files = fs.readdirSync(POSTS_DIR)
    .filter(file => file.endsWith('.mdx'))
    .map(file => path.join(POSTS_DIR, file));
  
  console.log(`Found ${files.length} MDX files to process`);
  
  // Process each file
  files.forEach(convertYamlToJsonFrontmatter);
  
  // Print summary
  console.log('\nMigration complete!');
  console.log(`Total files processed: ${stats.total}`);
  console.log(`Already using JSON: ${stats.alreadyJson}`);
  console.log(`Converted from YAML to JSON: ${stats.converted}`);
  console.log(`Fixed formatting issues: ${stats.fixed}`);
  console.log(`Errors: ${stats.errors}`);
}

// Run the migration
migrateAllMdxFiles();
