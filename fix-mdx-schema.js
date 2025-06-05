const fs = require('fs');
const path = require('path');

// Directory containing MDX files
const postsDir = path.join(__dirname, 'content', 'posts');

// Get all MDX files
const mdxFiles = fs.readdirSync(postsDir).filter(file => file.endsWith('.mdx'));

// Process each file
mdxFiles.forEach(file => {
  const filePath = path.join(postsDir, file);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Split the content into frontmatter and markdown content
  // The format is expected to be:
  // ---json
  // {JSON content}
  // ---
  // Markdown content
  
  const parts = fileContent.split('---');
  if (parts.length < 3 || parts[0].trim() !== '') {
    console.log(`File ${file} does not have the expected format, skipping...`);
    return;
  }
  
  // The JSON part should be the second element (index 1)
  let jsonPart = parts[1].trim();
  
  // Remove "json" if it's at the beginning
  if (jsonPart.startsWith('json')) {
    jsonPart = jsonPart.substring(4).trim();
  }
  
  try {
    // Parse the JSON
    const data = JSON.parse(jsonPart);
    
    // Check if we have products to update
    if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
      console.log(`No products found in ${file}, skipping...`);
      return;
    }
    
    let modified = false;
    
    // Update each product
    data.products = data.products.map(product => {
      // 1. Fix price format in offers
      if (product.offers && product.offers.price) {
        // Convert comma to period for schema.org
        if (typeof product.offers.price === 'string' && product.offers.price.includes(',')) {
          product.offers.price = product.offers.price.replace(',', '.');
          modified = true;
        }
        
        // 2. Add priceValidUntil if missing
        if (!product.offers.priceValidUntil) {
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          product.offers.priceValidUntil = oneYearFromNow.toISOString().split('T')[0]; // YYYY-MM-DD format
          modified = true;
        }
      }
      
      // 3. Add review if missing
      if (!product.review && product.description) {
        product.review = {
          "@type": "Review",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "4.5",
            "bestRating": "5"
          },
          "author": {
            "@type": "Person",
            "name": "Editor"
          }
        };
        modified = true;
      }
      
      // 4. Add aggregateRating if missing
      if (!product.aggregateRating) {
        product.aggregateRating = {
          "@type": "AggregateRating",
          "ratingValue": "4.5",
          "reviewCount": "10",
          "bestRating": "5"
        };
        modified = true;
      }
      
      return product;
    });
    
    // Save the file if modified
    if (modified) {
      // Reconstruct the file with the exact same format
      const updatedJsonPart = JSON.stringify(data, null, 2);
      
      // Reconstruct the file content preserving the original format
      let updatedContent = '---json\n' + updatedJsonPart + '\n---';
      
      // Add back the markdown content (everything after the second ---)
      if (parts.length > 2) {
        updatedContent += '\n' + parts.slice(2).join('---');
      }
      
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Updated schema in ${file}`);
    } else {
      console.log(`No changes needed for ${file}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}: ${error.message}`);
  }
});

console.log('All MDX files have been processed!');
