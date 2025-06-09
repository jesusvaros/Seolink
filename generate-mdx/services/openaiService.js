import { OpenAI } from 'openai';
import { config } from 'dotenv';

// Initialize environment variables
config();

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate MDX content using OpenAI
 * @param {Object} data - Content data to use for generation
 * @returns {Object} - Generated MDX content and metadata
 */
async function generateMDX(data) {
  console.log(`🤖 Generando MDX para "${data.title}"...`);
  
  try {
    // Extract Amazon products from the content
    const extractedProducts = await extractAmazonProducts(data);
    
    if (!extractedProducts || extractedProducts.length === 0) {
      console.log('⚠️ No se encontraron productos de Amazon válidos.');
      return null;
    }
    
    // Generate frontmatter
    const frontmatter = await generateFrontmatter(data, extractedProducts);
    
    // Generate imports section
    const imports = `import { ProductShowcase, ProductComparison, Conclusion } from '../components';\n`;
    
    // Generate body content
    let bodyContent = '';
    
    // Introduction
    bodyContent += `# ${data.title}\n\n`;
    bodyContent += `${data.excerpt || 'Bienvenido a nuestra guía de productos.'}\n\n`;
    
    // Product showcases
    for (const product of extractedProducts) {
      bodyContent += `<ProductShowcase
  name="${product.name || 'Producto'}"
  image="${product.image || '/placeholder.jpg'}"
  description="${product.description || 'Descripción no disponible'}"
  price="${product.price || 'Precio no disponible'}"
  link="${product.link || '#'}"
  destacado="${product.destacado || 'Producto destacado'}"
/>\n\n`;
    }
    
    // Product comparison if there are multiple products
    if (extractedProducts.length > 1) {
      bodyContent += `<ProductComparison products={${JSON.stringify(extractedProducts, null, 2)}} />\n\n`;
    }
    
    // Conclusion
    bodyContent += `${data.conclusion || 'Esperamos que esta guía te haya ayudado a encontrar el producto perfecto para tus necesidades.'}\n`;
    
    const mdxContent = `---json
${frontmatter}
---

${imports}

${bodyContent}`;

    console.log('✅ Archivo MDX creado correctamente');
    return mdxContent;
  } catch (error) {
    console.error('❌ Error al generar MDX:', error.message);
    throw error;
  }
}

/**
 * Extract Amazon products from content
 * @param {Object} data - Content data
 * @returns {Array} - Extracted products
 */
async function extractAmazonProducts(data) {
  console.log('🔍 Extrayendo productos de Amazon del contenido...');
  
  try {
    const prompt = `
      Analiza el siguiente contenido y extrae información sobre productos de Amazon.
      Para cada producto, proporciona:
      - Nombre del producto
      - Descripción breve
      - Precio (si está disponible)
      - Enlace de Amazon
      - Características principales (si están disponibles)
      - Pros y contras (si están disponibles)

      Contenido:
      ${data.content}
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Eres un asistente especializado en extraer información de productos de Amazon de contenido web." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });
    
    // Parse the response to extract product information
    const productData = response.choices[0].message.content;
    
    // Process the extracted products
    const products = parseProductData(productData, data.productLinks);
    
    console.log(`✅ Se encontraron ${products.length} productos.`);
    return products;
  } catch (error) {
    console.error('❌ Error al extraer productos:', error.message);
    return [];
  }
}

/**
 * Parse product data from OpenAI response
 * @param {string} productData - Raw product data from OpenAI
 * @param {Array} productLinks - Product links from the page
 * @returns {Array} - Parsed products
 */
function parseProductData(productData, productLinks) {
  // This is a simplified parser - in a real implementation, you would
  // need more robust parsing logic based on the actual response format
  const products = [];
  
  // Simple regex-based parsing for demonstration
  const productBlocks = productData.split(/Producto \d+:|Producto:/);
  
  for (let i = 1; i < productBlocks.length; i++) {
    const block = productBlocks[i].trim();
    
    // Extract name
    const nameMatch = block.match(/Nombre:?\s*([^\n]+)/i);
    const name = nameMatch ? nameMatch[1].trim() : 'Producto sin nombre';
    
    // Extract description
    const descMatch = block.match(/Descripción:?\s*([^\n]+)/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Extract price
    const priceMatch = block.match(/Precio:?\s*([^\n]+)/i);
    const price = priceMatch ? priceMatch[1].trim() : 'Precio no disponible';
    
    // Extract link - use the first available product link if not found in text
    const linkMatch = block.match(/Enlace:?\s*([^\n]+)/i);
    const link = linkMatch ? linkMatch[1].trim() : (productLinks[i-1] || '#');
    
    // Extract ASIN if available in the link
    const asinMatch = link.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
    const asin = asinMatch ? asinMatch[1] : '';
    
    // Extract pros
    const prosMatch = block.match(/Pros:?\s*([\s\S]*?)(?=Contras:|$)/i);
    const prosText = prosMatch ? prosMatch[1].trim() : '';
    const pros = prosText.split(/\n-|\n\*/g).map(p => p.trim()).filter(p => p);
    
    // Extract cons
    const consMatch = block.match(/Contras:?\s*([\s\S]*?)(?=\n\n|$)/i);
    const consText = consMatch ? consMatch[1].trim() : '';
    const cons = consText.split(/\n-|\n\*/g).map(c => c.trim()).filter(c => c);
    
    // Create product object
    const product = {
      name,
      description,
      price,
      link,
      asin,
      pros,
      cons,
      destacado: `Producto destacado ${i}`
    };
    
    products.push(product);
  }
  
  return products;
}

/**
 * Generate frontmatter for MDX
 * @param {Object} data - Content data
 * @param {Array} products - Extracted products
 * @returns {string} - Generated frontmatter
 */
async function generateFrontmatter(data, products) {
  console.log('📝 Generando frontmatter para MDX...');
  
  try {
    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-');
    
    // Generate category based on content
    const categoryPrompt = `
      Basándote en el siguiente título y contenido, asigna una categoría adecuada.
      Elige entre: tecnologia, hogar, belleza, deportes, mascotas, jardin, cocina, moda, juguetes, libros.
      Solo responde con una palabra, la categoría más adecuada.

      Título: ${data.title}
      Contenido: ${data.excerpt || ''}
    `;
    
    const categoryResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Asigna una categoría basada en el contenido. Responde solo con una palabra." },
        { role: "user", content: categoryPrompt }
      ],
      temperature: 0.3,
      max_tokens: 20
    });
    
    const category = categoryResponse.choices[0].message.content.trim().toLowerCase();
    
    // Create frontmatter object
    const frontmatterObj = {
      title: data.title,
      slug,
      date: data.date,
      category,
      image: data.image || '/default-image.jpg',
      excerpt: data.excerpt || `Guía de los mejores productos de ${category}`,
      products: products.map(p => ({
        name: p.name,
        asin: p.asin || '',
        image: p.image || '',
        price: p.price || 'Precio no disponible',
        link: p.link || '#',
        destacado: p.destacado || 'Producto destacado'
      }))
    };
    
    // Convert to JSON string with proper indentation
    return JSON.stringify(frontmatterObj, null, 2);
  } catch (error) {
    console.error('❌ Error al generar frontmatter:', error.message);
    
    // Return a basic frontmatter if there's an error
    const basicFrontmatter = {
      title: data.title,
      slug: data.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-'),
      date: data.date,
      category: 'general',
      image: data.image || '/default-image.jpg',
      excerpt: data.excerpt || 'Guía de productos',
      products: products.map(p => ({
        name: p.name,
        link: p.link || '#',
        destacado: 'Producto destacado'
      }))
    };
    
    return JSON.stringify(basicFrontmatter, null, 2);
  }
}

export {
  generateMDX
};
