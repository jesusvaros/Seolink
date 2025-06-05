import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import { config } from 'dotenv';
import { OpenAI } from 'openai';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { chromium } from 'playwright';
import { URL } from 'url';

config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const turndown = new TurndownService();

const URLS_DIR = path.join(process.cwd(), 'urls');
const PROCESSED_URLS_PATH = path.join(URLS_DIR, 'processed-urls.json');
const OUTPUT_DIR = path.join(process.cwd(), 'content', 'posts');
const EXCLUDED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  // Add other domains to exclude, e.g., your own site if you're scraping yourself by mistake
  // 'www.example.com'
];

async function loadUrlsFromFiles() {
  let allUrls = [];
  try {
    const files = fs.readdirSync(URLS_DIR);
    for (const file of files) {
      if (file.endsWith('.json') && file !== 'processed-urls.json') {
        const filePath = path.join(URLS_DIR, file);
        try {
          const data = fs.readFileSync(filePath, 'utf-8');
          const urlsInFile = JSON.parse(data);
          if (Array.isArray(urlsInFile)) {
            allUrls = allUrls.concat(urlsInFile.filter(url => typeof url === 'string' && url.trim() !== ''));
          } else {
            console.warn(`⚠️ Contenido de ${file} no es un array, se omitirá.`);
          }
        } catch (err) {
          console.error(`Error al leer o parsear ${filePath}:`, err.message);
        }
      }
    }
  } catch (error) {
    console.error('Error al leer el directorio de URLs:', error.message);
  }
  console.log(`📂 Encontradas ${allUrls.length} URLs en los archivos fuente.`);
  return allUrls;
}


function loadProcessedUrls() {
  try {
    if (fs.existsSync(PROCESSED_URLS_PATH)) {
      const data = fs.readFileSync(PROCESSED_URLS_PATH, 'utf-8');
      return JSON.parse(data);
    } else {
      // If the file doesn't exist, create it with an empty array
      fs.writeFileSync(PROCESSED_URLS_PATH, JSON.stringify([], null, 2));
      return [];
    }
  } catch (error) {
    console.error('Error loading processed URLs:', error);
    // If there's an error (e.g., corrupted JSON), start fresh
    fs.writeFileSync(PROCESSED_URLS_PATH, JSON.stringify([], null, 2));
    return [];
  }
}

function saveProcessedUrls(urls) {
  try {
    fs.writeFileSync(PROCESSED_URLS_PATH, JSON.stringify(urls, null, 2));
    console.log(`💾 URLs procesadas guardadas en ${PROCESSED_URLS_PATH}`);
  } catch (error) {
    console.error('Error saving processed URLs:', error);
  }
}

function isExcludedDomain(urlString) {
  if (!urlString) return true; // Exclude empty or null URLs
  try {
    const parsedUrl = new URL(urlString);
    const domain = parsedUrl.hostname.startsWith('www.') ? parsedUrl.hostname.substring(4) : parsedUrl.hostname;
    return EXCLUDED_DOMAINS.includes(domain);
  } catch (error) {
    console.warn(`⚠️ URL inválida para exclusión de dominio: ${urlString} - ${error.message}`);
    return true; // Exclude invalid URLs by default
  }
}

// Función para indentar texto multilínea en YAML
function indentMultiline(text, indent = '      ') {
  return text
    .split('\n')
    .map(line => indent + line)
    .join('\n') + '\n';
}

// Verificar si una URL contiene enlaces de Amazon antes de procesarla completamente
async function containsAmazonLinks(url) {
  console.log(`🔍 Verificando si ${url} contiene enlaces de Amazon...`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Buscar enlaces de Amazon o texto que indique comparativas de productos
    // Contar enlaces directos a Amazon
    const uniqueAmazonLinkCount = await page.evaluate(() => {
      const amazonLinks = Array.from(document.querySelectorAll('a')).filter(a =>
        a.href.includes('amazon.') ||
        a.href.includes('/dp/') ||
        a.href.includes('/gp/product/')
      );
      const uniqueHrefs = new Set(amazonLinks.map(a => a.href));
      return uniqueHrefs.size;
    });

    await browser.close();
    const meetsLinkThreshold = uniqueAmazonLinkCount >= 3;

    if (meetsLinkThreshold) {
      console.log(`🔗 La URL ${url} contiene ${uniqueAmazonLinkCount} enlaces de Amazon únicos.`);
      return true;
    } else {
      console.warn(`⚠️ La URL ${url} contiene ${uniqueAmazonLinkCount} enlaces de Amazon únicos. No cumple el mínimo de 3.`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error al verificar enlaces de Amazon en ${url}:`, error.message);
    await browser.close();
    return false;
  }
}

// Extraer contenido limpio desde cualquier web
async function fetchCleanContent(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const html = await page.content();
  // Remove script and style tags to avoid JSDOM parsing issues with complex CSS/JS
  const cleanedHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  const dom = new JSDOM(cleanedHtml, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  // Extract Amazon product prices from buttons/links
  const productPrices = await page.evaluate(() => {
    // Find all links/buttons that look like Amazon buy buttons
    const buttons = Array.from(document.querySelectorAll('a, button'));
    const amazonButtons = buttons.filter(el => {
      const href = el.href || '';
      return (
        href.includes('amazon.') ||
        href.includes('/dp/') ||
        href.includes('/gp/product/') ||
        (el.textContent && el.textContent.toLowerCase().includes('amazon'))
      );
    });
    // Extract price and ASIN if possible
    return amazonButtons.map(el => {
      const text = el.textContent || '';
      // Match price patterns like 39,99 €, 39.99 €, 39 €
      const priceMatch = text.match(/(\d{1,3}[\.,]\d{2}|\d{1,3})\s*€|EUR/i);
      let price = priceMatch ? priceMatch[0].replace(/[^\d.,]/g, '').replace(',', '.') : null;
      if (price) {
        // Normalize price to XX.XX format if possible
        if (!price.includes('.')) price = price + '.00';
        if (/^\d+\.\d{1}$/.test(price)) price = price + '0';
      }
      // Try to extract ASIN from href
      let asin = null;
      const href = el.href || '';
      const asinMatch = href.match(/\/dp\/(B0[0-9A-Z]{8})|\/gp\/product\/(B0[0-9A-Z]{8})/i);
      if (asinMatch) {
        asin = asinMatch[1] || asinMatch[2];
      }
      return {
        asin: asin || null,
        price: price || null,
        href: href || null,
        text: text.trim(),
      };
    });
  });

  await browser.close();
  return {
    title: article.title || 'Sin título',
    content: article.content || '',
    excerpt: article.excerpt || '',
    image: article.image || '',
    date: new Date().toISOString().split('T')[0],
    url,
    productPrices, // <-- array of {asin, price, href, text}
  };
}

// Generar MDX con GPT-4o
export async function generateMDX({ title, content, url, date, image, productPrices = [] }) {
  const markdown = turndown.turndown(content);
  
  // Prompt mejorado para extraer múltiples productos con especificaciones inteligentes
  // Incluir precios extraídos en el prompt
  let preciosExtraidos = '';
  if (productPrices && productPrices.length > 0) {
    preciosExtraidos = '\n\nPrecios extraídos de la página fuente para los productos (por ASIN si está disponible, o por orden de aparición):\n';
    productPrices.forEach((p, i) => {
      preciosExtraidos += `  - Producto ${i + 1}`;
      if (p.asin) preciosExtraidos += ` (ASIN: ${p.asin})`;
      if (p.price) preciosExtraidos += `: ${p.price} €`;
      else preciosExtraidos += ': PRICE_NOT_FOUND';
      preciosExtraidos += `\n`;
    });
    preciosExtraidos += '\n';
  }

  const prompt = `
Eres un asistente experto en SEO técnico y creación de contenido para sitios de e-commerce y comparativas de productos.
Tu tarea es analizar el siguiente texto extraído de una página web y estructurar la información clave en formato JSON.
${preciosExtraidos}
IMPORTANTE: Para cada producto, si se ha encontrado un precio en la página fuente, úsalo exactamente como se extrajo (por ejemplo, '39,99'). Si no hay precio, usa la cadena exacta 'PRICE_NOT_FOUND'.\nEste JSON se utilizará para generar automáticamente una página de artículo optimizada para SEO y para crear datos estructurados schema.org/Product.

Información de la fuente:
Título Original: ${title}
Fecha de Publicación Original: ${date} // Esta es la fecha del artículo original
URL Original: ${url}

Contenido extraído (Markdown):
---
${markdown}
---

Instrucciones para la extracción y generación del JSON:
1.  **Identifica Productos**: Extrae entre 8 y 10 productos distintos mencionados en el texto. Si hay menos, extrae todos los que encuentres.
2.  **Datos del Artículo General**:
    *   \`title\`: Genera un título atractivo y optimizado para SEO para el nuevo artículo de comparación (máximo 60-70 caracteres). Puede basarse en el título original.
    *   \`slug\`: Genera un slug corto y descriptivo a partir del \`title\` (ej: "mejores-freidoras-aire-2025").
    *   \`category\`: Infiere la categoría principal del artículo (ej: Cocina, Electrónica, Hogar, Belleza, Jardín).
    *   \`date\`: Usa la fecha actual en formato YYYY-MM-DD para el nuevo artículo.
    *   \`metaDescription\`: Escribe una meta descripción única y atractiva (150-160 caracteres) que resuma el contenido del artículo y anime al clic.
    *   \`introduction\`: Escribe un párrafo introductorio (60-100 palabras) que enganche al lector, presente el tema y mencione brevemente lo que encontrará.
    *   \`conclusion\`: Escribe un párrafo de conclusión (50-80 palabras) que resuma los puntos clave y, si es apropiado, ofrezca una recomendación general o invite a la acción.
3.  **Datos Específicos por Producto**: Para cada producto, completa los campos del JSON adjunto. Sigue estas directrices:
    *   **Prioriza la Exactitud**: Usa la información del texto fuente siempre que sea posible.
    *   **Inferencia Realista**: Si faltan datos (ej: \`reviewCount\`, \`ratingValue\`, especificaciones exactas), infiérelos de manera realista y coherente con el tipo de producto. No inventes marcas o precios absurdos.
    *   \`name\`: Nombre completo y claro.
    *   \`asin\`: Si es un producto de Amazon y el ASIN está disponible o es fácilmente identificable (formato B0XXXXXXXX), inclúyelo. **Si no se encuentra un ASIN válido y extraíble del texto, usa la cadena exacta 'NO_ASIN_FOUND'. No inventes ASINs ni uses 'PENDIENTE_ASIN'.** Este será usado como \`productID\`.
    *   \`brand.name\`: Marca reconocible. Si no se menciona, intenta inferirla o usa "Genérico" si es apropiado.
    *   \`image.url\`: Si el texto fuente incluye URLs de imágenes, úsalas. Si no, usa un placeholder descriptivo como "PENDIENTE_URL_IMAGEN_PRODUCTO". La imagen debe ser de alta calidad y representativa.
    *   \`description\`: Resumen breve (1-2 frases).
    *   \`detailedDescription\`: Explicación más extensa (2-4 frases) sobre beneficios y características.
    *   \`pros\` / \`cons\`: Listas de 3-5 puntos clave para cada uno. Sé objetivo.
    *   \`offers\`:
        *   \`priceCurrency\`: Infiere la moneda (ej: "EUR", "USD").
        *   \`price\`: Número en formato XX.XX (ej: 39.99). Si el precio no está claro, usa la cadena exacta 'PRICE_NOT_FOUND' como placeholder.
        *   \`availability\`: Usa "https://schema.org/InStock" por defecto, a menos que el texto indique lo contrario ("https://schema.org/OutOfStock", "https://schema.org/PreOrder").
        *   \`url\`: Usa "PENDIENTE_URL_AFILIADO" como placeholder. Este se llenará después.
        *   \`priceValidUntil\`: Opcional. Si se conoce la validez de la oferta, inclúyela (YYYY-MM-DD).
    *   \`review\` / \`aggregateRating\`:
        *   Si el texto contiene una reseña específica para el producto, usa el objeto \`review\`. \`author.name\` puede ser "Análisis del Experto" o el nombre del sitio. \`datePublished\` debe ser la fecha actual.
        *   Si hay datos agregados (ej: "4.5 estrellas de 120 opiniones"), usa \`aggregateRating\`.
        *   Si no hay datos de reseñas, puedes omitir estas secciones o inferir valores modestos y realistas para \`aggregateRating\` (ej: ratingValue 4.0, reviewCount 10-50).
    *   \`productID\`: Usa el ASIN si está disponible y es válido (formato B0XXXXXXXX). **Si el ASIN es 'NO_ASIN_FOUND', usa 'NO_ASIN_FOUND' aquí también.**
    *   \`sku\`, \`mpn\`, \`gtin13\`: Inclúyelos si están explícitamente en el texto.
    *   \`specifications\`: De 4 a 6 especificaciones técnicas *cruciales* para ese tipo de producto. Sé específico (ej: para un móvil: "Pantalla": "6.5 pulgadas OLED", "RAM": "8GB", "Almacenamiento": "128GB", "Batería": "4500mAh").
    *   \`additionalProperty\`: Para otras características relevantes no cubiertas por los campos estándar.
4.  **Formato JSON**: Devuelve ÚNICAMENTE el objeto JSON completo. No incluyas explicaciones adicionales antes o después del JSON. Asegúrate de que el JSON sea válido.

JSON Esperado:
\`\`\`json
{
  "title": "Título generado para el artículo",
  "slug": "slug-generado-para-el-articulo",
  "category": "Categoría Inferida",
  "date": "YYYY-MM-DD",
  "metaDescription": "Meta descripción generada (150-160 caracteres)",
  "introduction": "Párrafo introductorio generado.",
  "conclusion": "Párrafo de conclusión generado.",
  "products": [
    {
      "name": "Nombre completo y claro del producto",
      "asin": "ASIN_DEL_PRODUCTO_SI_APLICA",
      "brand": {
        "@type": "Brand",
        "name": "Marca del producto"
      },
      "image": {
        "@type": "ImageObject",
        "url": "URL_IMAGEN_PRODUCTO_O_PLACEHOLDER",
        "caption": "Descripción breve de la imagen (opcional)"
      },
      "description": "Descripción concisa del producto (1-2 frases).",
      "detailedDescription": "Descripción más elaborada del producto (2-4 frases).",
      "pros": ["Ventaja clave 1", "Ventaja clave 2", "Ventaja clave 3"],
      "cons": ["Desventaja o limitación 1", "Desventaja o limitación 2"],
      "offers": {
        "@type": "Offer",
        "priceCurrency": "EUR", // o USD, etc.
        "price": "EXTRAER_PRECIO_REAL", // EXTRAE EL PRECIO NUMÉRICO REAL DEL PRODUCTO (ej: "19.99"). SI ES ABSOLUTAMENTE IMPOSIBLE ENCONTRAR UN PRECIO, USA LA CADENA EXACTA 'PRICE_NOT_FOUND'. No uses '0.00' como placeholder a menos que sea el precio real (muy improbable).
        "availability": "https://schema.org/InStock", // o OutOfStock, PreOrder
        "url": "PENDIENTE_URL_AFILIADO",
        "priceValidUntil": "YYYY-MM-DD" // Opcional
      },
      "review": { // Opcional, si hay reseña individual
        "@type": "Review",
        "author": {"@type": "Person", "name": "Análisis del Experto"}, // o nombre del sitio
        "datePublished": "YYYY-MM-DD",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "4.0", // Inferir o placeholder
          "bestRating": "5"
        },
        "reviewBody": "Cuerpo de la reseña o resumen de la opinión."
      },
      "aggregateRating": { // Opcional, si hay datos agregados o para inferir
        "@type": "AggregateRating",
        "ratingValue": "4.0", // Inferir o placeholder
        "reviewCount": "10",  // Inferir o placeholder
        "bestRating": "5"
      },
      "productID": "ASIN_O_ID_UNICO_PRODUCTO",
      "sku": "SKU_SI_DISPONIBLE",
      "mpn": "MPN_SI_DISPONIBLE",
      "gtin13": "EAN_O_GTIN13_SI_DISPONIBLE", // o gtin8, gtin12 (UPC)
      "specifications": {
        "EspecificacionClave1": "Valor1",
        "EspecificacionClave2": "Valor2",
        "EspecificacionClave3": "Valor3",
        "EspecificacionClave4": "Valor4"
      },
      "additionalProperty": [ // Para otras características no cubiertas
        {"@type": "PropertyValue", "name": "Característica Adicional 1", "value": "Valor 1"}
      ]
    }
    // ... más productos (objetivo 8-10)
  ]
}
\`\`\`
`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });

    // Obtener la respuesta y extraer el JSON
    const responseContent = chat.choices[0].message.content;
    let jsonData;
    
    try {
      // Intentar parsear directamente, o extraer el JSON si está rodeado de texto
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      } else {
        jsonData = JSON.parse(responseContent);
      }
      console.log('✅ JSON extraído correctamente');
    } catch (error) {
      console.error('❌ Error al parsear el JSON:', error.message);
      console.error('Raw OpenAI response that failed to parse:');
      console.error(responseContent); // Log the problematic string
      jsonData = null; // Ensure jsonData is null if parsing failed
    }
    
    // Si jsonData es null (debido a un error de parseo), no podemos continuar.
    if (jsonData === null) {
      console.error('❌ No se pudo generar MDX porque el JSON de OpenAI no se pudo parsear.');
      return null; // Indica que la generación de MDX falló
    }

    // Generar el MDX con estructura garantizada
    const mdxContent = createValidMDX(jsonData, image);
    return mdxContent;
    
  } catch (error) {
    console.error('❌ Error al generar MDX:', error.message);
    throw error;
  }
}

function createValidMDX(data, fallbackImage) {
  console.log('🔧 Creando archivo MDX con estructura válida...');
  const validASINRegex = /^B0[0-9A-Z]{8}$/;
  const validProducts = (data.products || []).filter(product =>
    product.asin && typeof product.asin === 'string' && validASINRegex.test(product.asin.trim()) && product.asin.trim() !== 'NO_ASIN_FOUND' && product.asin.trim() !== 'PENDIENTE_ASIN'
  ).map(p => ({ ...p, asin: p.asin.trim() })); // Trim ASIN for good measure

  if (validProducts.length === 0) {
    console.log('ℹ️ No se encontraron productos con ASIN válido. No se generará MDX para esta URL.');
    return null; // Signal to main function not to create MDX
  }
  console.log(`ℹ️ Encontrados ${validProducts.length} productos con ASINs válidos.`);

  const slug = data.slug || slugify(data.title, { lower: true, strict: true });

  // Create frontmatter object for JSON
  const frontmatterObj = {
    title: data.title,
    date: new Date().toISOString().split('T')[0],
    slug: slug,
    image: validProducts[0]?.image?.url || validProducts[0]?.image || fallbackImage || '/default-placeholder.jpg', // Use validProducts and prefer .url
    excerpt: data.excerpt,
    category: data.category || 'general',
    products: []
  };

  // Add products to frontmatter preserving all properties dinámicamente
  if (data.products && data.products.length > 0) {
    frontmatterObj.products = validProducts.map(product => {
      // Crear objeto base con propiedades esenciales
      let displayPrice = 'Precio no disponible';

      if (product.offers && typeof product.offers.price === 'string' && product.offers.price.trim() !== '') {
        if (product.offers.price.toUpperCase() === 'PRICE_NOT_FOUND') {
          // displayPrice remains 'Precio no disponible'
        } else {
          const priceString = product.offers.price.replace(',', '.');
          const parsedPrice = parseFloat(priceString);
          if (!isNaN(parsedPrice) && parsedPrice > 0) {
            const priceValue = parsedPrice.toFixed(2);
            const currency = product.offers.priceCurrency || 'EUR';
            let currencySymbol = currency === 'EUR' ? '€' : (currency === 'USD' ? '$' : currency);
            if (currency.toUpperCase() === 'EUR') {
              displayPrice = `${priceValue.replace('.', ',')} ${currencySymbol}`.trim();
            } else if (currency.toUpperCase() === 'USD') {
              displayPrice = `${currencySymbol}${priceValue}`.trim();
            } else {
              displayPrice = `${priceValue} ${currencySymbol}`.trim();
            }
          }
          // If parsedPrice is not > 0, displayPrice remains 'Precio no disponible' for this block
        }
      }

      // If displayPrice is still 'Precio no disponible', try the fallback product.price
      if (displayPrice === 'Precio no disponible' && product.price && typeof product.price === 'string' && product.price.trim() !== '') {
        if (product.price.toUpperCase() !== 'PRICE_NOT_FOUND') {
          const fallbackPriceString = product.price.replace(',', '.');
          const parsedFallbackPrice = parseFloat(fallbackPriceString);
          if (!isNaN(parsedFallbackPrice) && parsedFallbackPrice > 0) {
            // Assuming product.price might be pre-formatted or a simple value string like "19,99" or "$25.50"
            // We don't re-add currency symbols here, assuming it's already in a displayable format or the AI provides it as such.
            // If it needs currency formatting similar to offers.price, this part would need to know currency too.
            // For now, using it as is if it's a positive number.
            displayPrice = product.price; 
          }
        }
      }

      const productObj = {
        asin: product.asin, // Direct use of validated ASIN
        name: product.name,
        image: product.image || fallbackImage || 'https://hips.hearstapps.com/hmg-prod/images/placeholder-1.jpg',
        affiliateLink: `https://www.amazon.es/dp/${product.asin}?tag=oferta-limitada-21`, // Direct use of validated ASIN
        price: displayPrice,
        destacado: product.destacado || 'Producto recomendado',
        pros: product.pros || ['Calidad', 'Precio', 'Durabilidad'], // Default to array
        cons: product.cons || ['Ninguna desventaja significativa'], // Default to array
        description: product.description || 'Descripción breve del producto',
        detailedDescription: product.detailedDescription || 'Descripción detallada del producto con sus principales características.',
        offers: product.offers // Keep the original offers object for schema.org and other uses
      };
      
      // Filtrar propiedades que no queremos incluir en las especificaciones
      const excludedProps = ['asin', 'name', 'image', 'affiliateLink', 'price', 'destacado', 
                             'pros', 'cons', 'description', 'detailedDescription'];
      
      // Agregar todas las demás propiedades específicas del producto dinámicamente
      // Estas propiedades vendrían generadas por GPT-4o según el tipo de producto
      Object.keys(product).forEach(key => {
        if (!excludedProps.includes(key)) {
          productObj[key] = product[key];
        }
      });
      
      return productObj;
    });
  }

  // Ensure main image in frontmatter is a string URL and normalized
  if (typeof frontmatterObj.image === 'object' && frontmatterObj.image !== null) {
    frontmatterObj.image = frontmatterObj.image.url || fallbackImage || '/default-placeholder.jpg';
  } else if (typeof frontmatterObj.image !== 'string' || frontmatterObj.image === 'PENDIENTE_URL_IMAGEN_PRODUCTO' || frontmatterObj.image === 'NO_URL_IMAGEN') {
    frontmatterObj.image = fallbackImage || '/default-placeholder.jpg';
  }

  // Convert frontmatter object to JSON string with pretty formatting
  const frontmatter = JSON.stringify(frontmatterObj, null, 2);

  const imports = [
    "import ProductDetailCard from '../components/ProductDetailCard'",
    "import ProductTable from '../components/ProductTable'",
    "import ProductRankingTable from '../components/ProductRankingTable'",
    "import ProductHeading from '../components/ProductHeading'",
    "import ArticleCard from '../components/ArticleCard'"
  ].join('\n');

  let bodyContent = `# ${data.title}\n\n`;
  bodyContent += `## Resumen de los mejores productos\n\n`;
  bodyContent += `<ProductRankingTable products={products} />\n\n`;

  if (data.introduction) {
    bodyContent += `## Introducción\n\n${data.introduction}\n\n`;
  }

  bodyContent += `## Consejos antes de comprar\n\n`;
  bodyContent += `${data.content?.buying_tips || 'Antes de realizar tu compra, considera factores como el precio, la calidad y las características que necesitas.'}\n\n`;

  bodyContent += `## Valoraciones\n\n`;
  data.products?.forEach((product, index) => {
    bodyContent += `<ProductDetailCard product={products[${index}]} />\n\n`;
  });

  bodyContent += `## Conclusión\n\n`;
  bodyContent += `${data.conclusion || 'Esperamos que esta guía te haya ayudado a encontrar el producto perfecto para tus necesidades.'}\n`;

  const mdxContent = `---json
${frontmatter}
---

${imports}

${bodyContent}`;
  console.log('✅ Archivo MDX creado correctamente');
  return mdxContent;
}

// Placeholder function for MDX validation
function validateMDXStructure(mdxContent) {
  // TODO: Implement actual validation logic if needed
  // For now, just return the content as is.
  console.log('🔧 Validando estructura MDX (actualmente es un placeholder)...');
  return mdxContent;
}

function extractMetadataFromMDX(mdxContent) {
  console.log('ℹ️ Extrayendo metadatos del MDX...');
  try {
    const match = mdxContent.match(/^---json\n([\s\S]*?)\n---/m);
    if (!match || !match[1]) {
      console.error('❌ No se pudo encontrar el bloque JSON de frontmatter en el MDX.');
      return { slug: 'error-no-frontmatter', category: 'general', title: 'Error: Sin Frontmatter', date: new Date().toISOString().split('T')[0] };
    }
    const frontmatterString = match[1];
    const frontmatter = JSON.parse(frontmatterString);
    console.log('✅ Metadatos extraídos correctamente.');
    return {
      slug: frontmatter.slug || 'default-slug',
      category: frontmatter.category || 'general',
      title: frontmatter.title || 'Sin Título',
      date: frontmatter.date || new Date().toISOString().split('T')[0],
      image: frontmatter.image || '/default-placeholder.jpg',
      // Add any other fields needed by updateCategoriesJson
    };
  } catch (error) {
    console.error('❌ Error al parsear JSON del frontmatter:', error.message);
    // Return default/error values to prevent crashing updateCategoriesJson
    return { slug: 'error-parsing-frontmatter', category: 'general', title: 'Error: Parseo Frontmatter', date: new Date().toISOString().split('T')[0] };
  }
}

const CATEGORIES_PATH = path.join(process.cwd(), 'content', 'categories', 'categories.json');

async function updateCategoriesJson(articleMetadata) {
  console.log(`🔄 Actualizando ${CATEGORIES_PATH} con metadatos del artículo...`);
  let categoriesData = {};

  try {
    if (fs.existsSync(CATEGORIES_PATH)) {
      const fileContent = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
      if (fileContent.trim() === '') {
        console.warn(`⚠️ ${CATEGORIES_PATH} está vacío. Se inicializará.`);
        categoriesData = {}; // Initialize if empty
      } else {
        categoriesData = JSON.parse(fileContent);
      }
    } else {
      console.log(`ℹ️ ${CATEGORIES_PATH} no encontrado. Se creará uno nuevo.`);
      // Ensure directory exists
      const categoriesDir = path.dirname(CATEGORIES_PATH);
      if (!fs.existsSync(categoriesDir)) {
        fs.mkdirSync(categoriesDir, { recursive: true });
      }
    }
  } catch (error) {
    console.error(`❌ Error al leer o parsear ${CATEGORIES_PATH}. Se usará un objeto vacío. Error: ${error.message}`);
    categoriesData = {}; // Reset on error to prevent further issues
  }

  const categoryKey = articleMetadata.category || 'general';
  if (!categoriesData[categoryKey]) {
    categoriesData[categoryKey] = [];
  }

  // Evitar duplicados basados en el slug
  const existingArticleIndex = categoriesData[categoryKey].findIndex(article => article.slug === articleMetadata.slug);
  const newArticleEntry = {
    slug: articleMetadata.slug,
    title: articleMetadata.title,
    date: articleMetadata.date,
    image: articleMetadata.image,
    // excerpt: articleMetadata.excerpt, // Consider if excerpt is needed here
  };

  if (existingArticleIndex > -1) {
    console.log(`덮 Actualizando artículo existente en categoría '${categoryKey}': ${articleMetadata.slug}`);
    categoriesData[categoryKey][existingArticleIndex] = newArticleEntry;
  } else {
    console.log(`➕ Añadiendo nuevo artículo a categoría '${categoryKey}': ${articleMetadata.slug}`);
    categoriesData[categoryKey].push(newArticleEntry);
  }

  try {
    fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(categoriesData, null, 2));
    console.log(`✅ ${CATEGORIES_PATH} actualizado correctamente.`);
  } catch (error) {
    console.error(`❌ Error al guardar ${CATEGORIES_PATH}: ${error.message}`);
  }
}

// MAIN
async function main() {
  const scrapedResults = []; // Collect all scraped data here
  // Ensure content directories exist
  const postsDir = path.join(process.cwd(), 'content', 'posts');
  const categoriesDir = path.join(process.cwd(), 'content', 'categories');
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
    console.log(`Created directory: ${postsDir}`);
  }
  if (!fs.existsSync(categoriesDir)) {
    fs.mkdirSync(categoriesDir, { recursive: true });
    console.log(`Created directory: ${categoriesDir}`);
  }

  // Initialize processedUrls outside the try block so it's available in the catch block
  let processedUrls = [];
  
  try {
    processedUrls = loadProcessedUrls();
    const allUrls = await loadUrlsFromFiles();
    console.log(`🔢 Total de URLs encontradas: ${allUrls.length}`);
    
    // Filtrar URLs ya procesadas
    const uniqueInitialUrls = [...new Set(allUrls)];
    const urlsToProcess = uniqueInitialUrls.filter(url => url && !processedUrls.includes(url) && !isExcludedDomain(url));
    console.log(`Found ${allUrls.length} URLs in source files, ${uniqueInitialUrls.length} unique URLs initially.`);
    console.log(`Total URLs to process after filtering processed and excluded: ${urlsToProcess.length}`);
    
    if (urlsToProcess.length === 0) {
      console.log('✅ No hay nuevas URLs para procesar');
      // Save processedUrls even if no new URLs were processed, in case the file was cleaned up or new exclusions were added
      saveProcessedUrls(processedUrls);
      return;
    }
    
    // Procesar cada URL
    for (const url of urlsToProcess) {
    let didAttemptFullProcessing = false;
    try {
      console.log(`🔍 Procesando ${url}...`);
      
      // Primero verificar si la URL contiene productos de Amazon
      const hasAmazonProducts = await containsAmazonLinks(url);
      
      if (!hasAmazonProducts) {
        console.log(`⏩ Saltando ${url} - No contiene productos de Amazon`);
        // Marcar como procesada aunque no hayamos generado contenido
        processedUrls.push(url); // Add to in-memory list
        console.log(`✅ URL ${url} marcada como procesada y saltada (no Amazon links).`);
        // File will be saved at the end by saveProcessedUrls
        continue; // Pasar a la siguiente URL
      }
      
      // Si tiene productos de Amazon, continuamos con el proceso normal
      didAttemptFullProcessing = true; // Starting full processing attempt
      const data = await fetchCleanContent(url);
      
      // Add to scraped results after data is available
      scrapedResults.push({
        url,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        image: data.image,
        date: data.date,
        productPrices: data.productPrices
      });
      
      console.log(`📝 Generando MDX para "${data.title}"...`);
      let mdxContent = await generateMDX({ ...data, productPrices: data.productPrices });

      if (mdxContent === null) {
        console.log(`⏩ Saltando ${url} - No se encontraron productos con ASIN válido o no se cumplieron los criterios de generación.`);
        // Marcar como procesada aunque no hayamos generado contenido válido
        processedUrls.push(url); // Add to in-memory list
        console.log(`✅ URL ${url} marcada como procesada y saltada (sin productos válidos / criterios no cumplidos).`);
        // File will be saved at the end by saveProcessedUrls
        continue; // Pasar a la siguiente URL
      }
      
      // Validar y corregir la estructura del MDX antes de guardarlo
      mdxContent = validateMDXStructure(mdxContent);
      
      // Extraer metadatos para el nombre del archivo y actualizar categories.json
      const metadata = extractMetadataFromMDX(mdxContent);
      
      // Crear el slug para el nombre del archivo
      const fileName = `${metadata.slug}.mdx`;
      const filePath = path.join(OUTPUT_DIR, fileName);
      
      // Guardar el archivo
      fs.writeFileSync(filePath, mdxContent);
      console.log(`✅ Guardado en ${filePath}`);
      
      // Actualizar categories.json
      await updateCategoriesJson(metadata);
      
      // Marcar como procesada
      processedUrls.push(url); // Add to in-memory list
      console.log(`✅ URL ${url} marcada como procesada.`);
      // File will be saved at the end by saveProcessedUrls
      
    } catch (error) {
      console.error(`❌ Error al procesar ${url}:`, error.message);
      // If an error occurs during main processing, we still consider it an attempt for rate-limiting purposes
      didAttemptFullProcessing = true; 
    }
    
    // Pausa entre URLs para evitar sobrecargar la API, solo si se intentó procesamiento completo
    if (didAttemptFullProcessing && urlsToProcess.indexOf(url) < urlsToProcess.length - 1) {
      console.log(`⏳ Esperando 5 segundos antes de procesar la siguiente URL...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    }
    
    // Save all scraped results to a single file
    const scrapedFilePath = path.join(URLS_DIR, 'scraped_urls.json');
    fs.writeFileSync(scrapedFilePath, JSON.stringify(scrapedResults, null, 2));
    console.log(`✅ Todos los resultados guardados en ${scrapedFilePath}`);

    saveProcessedUrls(processedUrls); // Save all processed URLs at the end
    console.log('✅ Todas las URLs han sido procesadas.');
  } catch (error) {
    console.error('❌ Error global:', error);
    // Attempt to save processed URLs even if an error occurred during processing of one URL
    saveProcessedUrls(processedUrls);
  }
}

// Ejecutar el script solo si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Error global:', error);
    process.exit(1);
  });
}
