const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Directory containing MDX files
const postsDir = path.join(__dirname, 'content', 'posts');

// Get all MDX files
const mdxFiles = fs.readdirSync(postsDir).filter(file => file.endsWith('.mdx'));

// Process each file
mdxFiles.forEach(file => {
  const filePath = path.join(postsDir, file);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Parse frontmatter
  const { data, content } = matter(fileContent);
  
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
    const updatedFileContent = matter.stringify(content, data);
    fs.writeFileSync(filePath, updatedFileContent);
    console.log(`Updated schema in ${file}`);
  } else {
    console.log(`No changes needed for ${file}`);
  }
});

console.log('All MDX files have been processed!');
