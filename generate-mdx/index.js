import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import { config } from 'dotenv';
import { OpenAI } from 'openai';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { chromium } from 'playwright';

config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const turndown = new TurndownService();

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
    const amazonLinkCount = await page.evaluate(() => {
      const amazonLinks = Array.from(document.querySelectorAll('a')).filter(a =>
        a.href.includes('amazon.') ||
        a.href.includes('/dp/') ||
        a.href.includes('/gp/product/')
      );
      return amazonLinks.length;
    });

    await browser.close();
    const meetsLinkThreshold = amazonLinkCount >= 3;

    if (meetsLinkThreshold) {
      console.log(`✅ La URL ${url} contiene ${amazonLinkCount} enlaces de Amazon (mínimo 3 requeridos).`);
    } else {
      console.log(`⚠️ La URL ${url} contiene ${amazonLinkCount} enlaces de Amazon. No cumple el mínimo de 3.`);
    }

    return meetsLinkThreshold;
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
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  await browser.close();
  return {
    title: article.title || 'Sin título',
    content: article.content || '',
    excerpt: article.excerpt || '',
    image: article.image || '',
    date: new Date().toISOString().split('T')[0],
    url,
  };
}

// Generar MDX con GPT-4o
export async function generateMDX({ title, content, url, date, image }) {
  const markdown = turndown.turndown(content);
  
  // Prompt mejorado para extraer múltiples productos con especificaciones inteligentes
  const prompt = `
Eres un asistente experto en SEO técnico y creación de contenido para sitios de e-commerce y comparativas de productos.
Tu tarea es analizar el siguiente texto extraído de una página web y estructurar la información clave en formato JSON.
Este JSON se utilizará para generar automáticamente una página de artículo optimizada para SEO y para crear datos estructurados schema.org/Product.

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
        *   \`price\`: Número en formato XX.XX (ej: 39.99). Si el precio no está claro, usa 0.00 como placeholder.
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
      let displayPrice = 'Precio no disponible'; // Default placeholder
      if (product.offers && typeof product.offers.price === 'string') {
        if (product.offers.price.toUpperCase() === 'PRICE_NOT_FOUND') {
          // displayPrice remains 'Precio no disponible'
        } else {
          const priceString = product.offers.price.replace(',', '.');
          const parsedPrice = parseFloat(priceString);

          if (!isNaN(parsedPrice)) { // Check if it's a number
            if (parsedPrice > 0) { // Check if it's a positive number
              const priceValue = parsedPrice.toFixed(2);
              const currency = product.offers.priceCurrency || 'EUR'; // Default to EUR if not specified
              let currencySymbol = '';
              switch (currency.toUpperCase()) {
                case 'EUR': currencySymbol = '€'; break;
                case 'USD': currencySymbol = '$'; break;
                default: currencySymbol = currency;
              }

              if (currency.toUpperCase() === 'EUR') {
                displayPrice = `${priceValue.replace('.', ',')} ${currencySymbol}`.trim();
              } else if (currency.toUpperCase() === 'USD') {
                displayPrice = `${currencySymbol}${priceValue}`.trim();
              } else {
                displayPrice = `${priceValue} ${currencySymbol}`.trim();
              }
            }
            // If parsedPrice is 0 or negative (and not 'PRICE_NOT_FOUND'), displayPrice remains 'Precio no disponible'
          } else if (product.price && typeof product.price === 'string' && product.price.trim() !== '' && product.price.toUpperCase() !== 'PRICE_NOT_FOUND') {
            // Fallback to top-level product.price if offers.price was not a number (and not 'PRICE_NOT_FOUND')
            const topLevelPriceString = product.price.replace(',', '.');
            const topLevelParsedPrice = parseFloat(topLevelPriceString);
            if (!isNaN(topLevelParsedPrice) && topLevelParsedPrice > 0) {
              displayPrice = product.price; // Use as is, assuming it's pre-formatted or a simple string
            }
          }
        }
      } else if (product.price && typeof product.price === 'string' && product.price.trim() !== '' && product.price.toUpperCase() !== 'PRICE_NOT_FOUND') {
        // Fallback if product.offers or product.offers.price is missing (and product.price is not 'PRICE_NOT_FOUND')
        const topLevelPriceString = product.price.replace(',', '.');
        const topLevelParsedPrice = parseFloat(topLevelPriceString);
        if (!isNaN(topLevelParsedPrice) && topLevelParsedPrice > 0) {
          displayPrice = product.price;
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

// Función para actualizar el archivo categories.json
async function updateCategoriesJson(article) {
  const categoriesPath = '../content/categories/categories.json';
  
  // Leer el archivo de categorías existente
  const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
  const categories = JSON.parse(categoriesData);
  
  // Verificar si la categoría existe, sino, crearla
  if (!categories[article.category]) {
    categories[article.category] = [];
    console.log(`✨ Nueva categoría creada: ${article.category}`);
  }
  
  // Verificar si el artículo ya existe en la categoría
  const existingArticleIndex = categories[article.category].findIndex(item => item.title === article.title);
  
  if (existingArticleIndex === -1) {
    // Si no existe, añadir a la categoría correspondiente
    categories[article.category].push({
      title: article.title,
      slug: article.slug,
      image: article.image
    });
    
    // Guardar el archivo actualizado
    fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
    console.log(`✅ Artículo añadido a la categoría ${article.category} en ${categoriesPath}`);
  } else {
    console.log(`ℹ️ El artículo ya existe en la categoría ${article.category}`);
  }
}

// Función para extraer metadatos del contenido MDX generado
function extractMetadataFromMDX(mdxContent) {
  // Regex actualizado para frontmatter JSON (---json ... ---)
  const frontMatterRegex = /---json\n([\s\S]*?)\n---/;
  const match = mdxContent.match(frontMatterRegex);
  
  if (!match || !match[1]) {
    throw new Error('No se pudo extraer el frontmatter del MDX generado');
  }
  
  try {
    // Parsear directamente el JSON
    const frontMatterData = JSON.parse(match[1]);
    
    // Verificar que existan los campos requeridos
    if (!frontMatterData.title || !frontMatterData.slug || !frontMatterData.image || !frontMatterData.category) {
      throw new Error('Falta información requerida en el frontmatter');
    }
    
    return {
      title: frontMatterData.title,
      slug: frontMatterData.slug,
      image: frontMatterData.image,
      category: frontMatterData.category
    };
  } catch (error) {
    throw new Error(`Error al parsear el JSON del frontmatter: ${error.message}`);
  }
}

// Rutas de directorios
const OUTPUT_DIR = '../content/posts';
const URLS_DIR = './urls';
const PROCESSED_URLS_FILE = './urls/processed-urls.json';

// Crear directorios si no existen
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(URLS_DIR)) fs.mkdirSync(URLS_DIR, { recursive: true });

// Cargar URLs ya procesadas
let processedUrls = [];
if (fs.existsSync(PROCESSED_URLS_FILE)) {
  try {
    processedUrls = JSON.parse(fs.readFileSync(PROCESSED_URLS_FILE, 'utf8'));
    console.log(`📋 Cargadas ${processedUrls.length} URLs ya procesadas anteriormente`);
  } catch (error) {
    console.error('⚠️ Error al cargar URLs procesadas:', error.message);
  }
}

// Función para cargar todas las URLs desde los archivos en el directorio 'urls'
async function loadUrlsFromFiles() {
  const urlFiles = fs.readdirSync(URLS_DIR)
    .filter(file => file.endsWith('.json') && file !== 'processed-urls.json');
  
  if (urlFiles.length === 0) {
    console.log('⚠️ No se encontraron archivos de URLs en', URLS_DIR);
    return [];
  }
  
  let allUrls = [];
  
  for (const file of urlFiles) {
    const filePath = path.join(URLS_DIR, file);
    try {
      const fileUrls = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`📄 Cargadas ${fileUrls.length} URLs desde ${file}`);
      allUrls = [...allUrls, ...fileUrls];
    } catch (error) {
      console.error(`⚠️ Error al cargar ${file}:`, error.message);
    }
  }
  
  return allUrls;
}

// Función para validar la estructura de un archivo MDX
function validateMDXStructure(mdxContent) {
  // Si el contenido está vacío, devolvemos un mensaje de error
  if (!mdxContent || mdxContent.trim() === '') {
    console.error('❌ Error: El contenido MDX está vacío');
    return mdxContent;
  }

  // JSON frontmatter (formato recomendado)
  if (mdxContent.startsWith('---json')) {
    const hasClosingDelimiter = mdxContent.includes('\n---\n');
    if (!hasClosingDelimiter) {
      console.error('❌ Error: Falta el delimitador de cierre del frontmatter JSON');
      // Intentar corregir automáticamente
      return mdxContent.replace(/---json\n([\s\S]*?)\n(import|#)/, '---json\n$1\n---\n\n$2');
    }

    // Verificar que el JSON es válido
    try {
      const jsonMatch = mdxContent.match(/---json\n([\s\S]*?)\n---/);
      if (jsonMatch && jsonMatch[1]) {
        JSON.parse(jsonMatch[1]);
        console.log('✅ Frontmatter JSON validado correctamente');
      }
    } catch (error) {
      console.error('❌ Error: El frontmatter JSON no es válido:', error.message);
      // No intentamos corregir errores de JSON ya que requeriría un análisis más complejo
    }
  } 
  // YAML frontmatter (legado, convertir a JSON si es posible)
  else if (mdxContent.startsWith('---\n')) {
    console.warn('⚠️ Advertencia: Usando formato YAML legado. Se recomienda usar JSON frontmatter.');
    const hasClosingDelimiter = /---\n[\s\S]*?\n---\n/.test(mdxContent);
    if (!hasClosingDelimiter) {
      console.error('❌ Error: Falta el delimitador de cierre del frontmatter YAML');
      // Intentar corregir automáticamente
      return mdxContent.replace(/---\n([\s\S]*?)\n(import|#)/, '---\n$1\n---\n\n$2');
    }

    // TODO: En una versión futura, podríamos convertir automáticamente YAML a JSON frontmatter
  }
  // Sin frontmatter o formato no reconocido
  else {
    console.error('❌ Error: El archivo MDX no tiene un frontmatter válido');
    // No intentamos corregir automáticamente ya que no hay suficiente información
  }
  
  return mdxContent;
}

// MAIN
async function main() {
  // Cargar URLs desde archivos
  const allUrls = await loadUrlsFromFiles();
  console.log(`🔢 Total de URLs encontradas: ${allUrls.length}`);
  
  // Filtrar URLs ya procesadas
  const urlsToProcess = allUrls.filter(url => !processedUrls.includes(url));
  console.log(`🆕 URLs nuevas a procesar: ${urlsToProcess.length}`);
  
  if (urlsToProcess.length === 0) {
    console.log('✅ No hay nuevas URLs para procesar');
    return;
  }
  
  // Procesar cada URL
  for (const url of urlsToProcess) {
    try {
      console.log(`🔍 Procesando ${url}...`);
      
      // Primero verificar si la URL contiene productos de Amazon
      const hasAmazonProducts = await containsAmazonLinks(url);
      
      if (!hasAmazonProducts) {
        console.log(`⏩ Saltando ${url} - No contiene productos de Amazon`);
        // Marcar como procesada aunque no hayamos generado contenido
        processedUrls.push(url);
        fs.writeFileSync(PROCESSED_URLS_FILE, JSON.stringify(processedUrls, null, 2));
        console.log(`✅ URL marcada como procesada y saltada`);
        continue; // Pasar a la siguiente URL
      }
      
      // Si tiene productos de Amazon, continuamos con el proceso normal
      const data = await fetchCleanContent(url);
      
      console.log(`📝 Generando MDX para "${data.title}"...`);
      let mdxContent = await generateMDX(data);

      if (mdxContent === null) {
        console.log(`⏩ Saltando ${url} - No se encontraron productos con ASIN válido o no se cumplieron los criterios de generación.`);
        // Marcar como procesada aunque no hayamos generado contenido válido
        processedUrls.push(url);
        fs.writeFileSync(PROCESSED_URLS_FILE, JSON.stringify(processedUrls, null, 2));
        console.log(`✅ URL marcada como procesada y saltada (sin productos válidos / criterios no cumplidos)`);
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
      processedUrls.push(url);
      fs.writeFileSync(PROCESSED_URLS_FILE, JSON.stringify(processedUrls, null, 2));
      console.log(`✅ URL marcada como procesada`);
      
    } catch (error) {
      console.error(`❌ Error al procesar ${url}:`, error.message);
    }
    
    // Pausa entre URLs para evitar sobrecargar la API
    console.log(`⏳ Esperando 5 segundos antes de procesar la siguiente URL...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log(`✅ Proceso completado. Se procesaron ${urlsToProcess.length} URLs.`);
}

// Ejecutar el script solo si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Error global:', error);
    process.exit(1);
  });
}
