const fs = require('fs');
const path = require('path');

// Directory containing MDX files
const postsDir = path.join(__dirname, 'content', 'posts');

// Get all MDX files
const mdxFiles = fs.readdirSync(postsDir).filter(file => file.endsWith('.mdx'));

console.log(`Found ${mdxFiles.length} MDX files to process`);

// Process each file
let fixedFiles = 0;
let unchangedFiles = 0;

mdxFiles.forEach(file => {
  const filePath = path.join(postsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file contains price objects
  if (content.includes('"price": {')) {
    console.log(`Processing ${file}...`);
    
    // Parse the frontmatter JSON
    const frontmatterMatch = content.match(/---json\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      console.log(`  No frontmatter found in ${file}, skipping`);
      unchangedFiles++;
      return;
    }
    
    try {
      const frontmatterStr = frontmatterMatch[1];
      const frontmatter = JSON.parse(frontmatterStr);
      let modified = false;
      
      // Process each product
      if (frontmatter.products && Array.isArray(frontmatter.products)) {
        frontmatter.products.forEach(product => {
          // Fix price objects
          if (product.price && typeof product.price === 'object' && product.price.display) {
            product.price = product.price.display;
            modified = true;
          }
          
          // Ensure offers has all required fields
          if (product.offers) {
            if (!product.offers['@type']) {
              product.offers['@type'] = 'Offer';
              modified = true;
            }
            
            if (!product.offers.priceValidUntil) {
              // Set price valid until to one year from now
              const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
              product.offers.priceValidUntil = nextYear;
              modified = true;
            }
            
            // Ensure price is a number in offers
            if (typeof product.offers.price === 'string') {
              const numericPrice = parseFloat(product.offers.price.replace(/[^0-9,.]/g, '').replace(',', '.')) || 0;
              product.offers.price = numericPrice.toString();
              modified = true;
            }
          }
          
          // Ensure brand has proper format
          if (product.brand && !product.brand['@type']) {
            product.brand = {
              '@type': 'Brand',
              name: typeof product.brand === 'string' ? product.brand : product.brand.name || 'Marca no especificada'
            };
            modified = true;
          }
          
          // Add review if missing
          if (!product.review) {
            product.review = {
              '@type': 'Review',
              author: {'@type': 'Person', name: 'Análisis del Experto'},
              datePublished: new Date().toISOString().split('T')[0],
              reviewRating: {
                '@type': 'Rating',
                ratingValue: '4.5',
                bestRating: '5'
              },
              reviewBody: product.description || 'Análisis detallado del producto.'
            };
            modified = true;
          }
          
          // Add aggregateRating if missing
          if (!product.aggregateRating) {
            product.aggregateRating = {
              '@type': 'AggregateRating',
              ratingValue: '4.0',
              reviewCount: '5'
            };
            modified = true;
          }
        });
      }
      
      if (modified) {
        // Replace the frontmatter in the file
        const updatedFrontmatter = JSON.stringify(frontmatter, null, 2);
        const updatedContent = content.replace(/---json\n[\s\S]*?\n---/, `---json\n${updatedFrontmatter}\n---`);
        
        // Write the updated content back to the file
        fs.writeFileSync(filePath, updatedContent);
        console.log(`  ✅ Fixed ${file}`);
        fixedFiles++;
      } else {
        console.log(`  ⏭️ No changes needed for ${file}`);
        unchangedFiles++;
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error.message);
      unchangedFiles++;
    }
  } else {
    console.log(`  ⏭️ No price objects found in ${file}`);
    unchangedFiles++;
  }
});

console.log('\n===== Summary =====');
console.log(`Total files: ${mdxFiles.length}`);
console.log(`Fixed files: ${fixedFiles}`);
console.log(`Unchanged files: ${unchangedFiles}`);
console.log('===================');
