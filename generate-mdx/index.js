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
    const hasAmazonLinks = await page.evaluate(() => {
      // Buscar enlaces a Amazon
      const amazonLinks = Array.from(document.querySelectorAll('a')).filter(a => 
        a.href.includes('amazon.') || 
        a.href.includes('/dp/') || 
        a.href.includes('/gp/product/')
      );
      
      // Buscar términos relacionados con comparativas de productos
      const productTerms = ['mejor', 'mejores', 'comparativa', 'análisis', 'review', 'opiniones', 'comprar'];
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
      const hasProductTermsInHeadings = headings.some(h => 
        productTerms.some(term => h.textContent.toLowerCase().includes(term))
      );
      
      // También buscar menciones de ASIN (código de producto Amazon)
      const hasASINMentions = document.body.textContent.includes('ASIN') || 
                             document.body.textContent.match(/B0[0-9A-Z]{8}/g);
      
      return amazonLinks.length > 0 || (hasProductTermsInHeadings && hasASINMentions);
    });
    
    await browser.close();
    
    if (hasAmazonLinks) {
      console.log(`✅ La URL ${url} contiene referencias a productos de Amazon.`);
    } else {
      console.log(`⚠️ La URL ${url} no parece contener productos de Amazon.`);
    }
    
    return hasAmazonLinks;
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
async function generateMDX({ title, content, url, date, image }) {
  const markdown = turndown.turndown(content);
  
  // Prompt mejorado para extraer múltiples productos
  const prompt = `
Crea un artículo para una web de comparación de productos basado en este contenido:

Título: ${title}
Fecha: ${date}
URL: ${url}

Texto extraído del artículo:
${markdown}

Devuelve la siguiente información en formato JSON:
{
  "title": "Título SEO optimizado",
  "slug": "slug-con-guiones",
  "excerpt": "Descripción breve del contenido",
  "category": "Elige entre: cocina, belleza, jardin, maquillaje, ropa, moda, general",
  "products": [
    {
      "name": "Nombre del primer producto",
      "asin": "B0XXXXX",
      "image": "${image || 'https://hips.hearstapps.com/hmg-prod/images/placeholder-1.jpg'}",
      "price": "39,99 €",
      "pros": "Ventaja 1, Ventaja 2, Ventaja 3",
      "cons": "Desventaja 1, Desventaja 2"
    },
    {
      "name": "Nombre del segundo producto",
      "asin": "B0YYYYY",
      "image": "${image || 'https://hips.hearstapps.com/hmg-prod/images/placeholder-2.jpg'}",
      "price": "49,99 €",
      "pros": "Calidad superior, Funcionalidad extra, Garantía extendida",
      "cons": "Precio elevado, Tamaño grande"
    },
    // Incluye tantos productos como encuentres en el artículo, mínimo 3 y máximo 10
  ],
  "content": {
    "intro": "Párrafo introductorio",
    "buying_tips": "Consejos para comprar",
    "conclusion": "Conclusión del artículo"
  }
}

IMPORTANTE: 
1. Analiza el contenido y extrae TODOS los productos mencionados (mínimo 3, máximo 10).
2. Para cada producto, busca su nombre exacto, características y ASIN de Amazon cuando sea posible.
3. Responde ÚNICAMENTE con el JSON, sin marcas de código ni texto adicional.
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
  const slug = data.slug || slugify(data.title, { lower: true, strict: true });

  // Create frontmatter object for JSON
  const frontmatterObj = {
    title: data.title,
    date: new Date().toISOString().split('T')[0],
    slug: slug,
    image: data.products[0]?.image || fallbackImage || 'https://hips.hearstapps.com/hmg-prod/images/placeholder-1.jpg',
    excerpt: data.excerpt,
    category: data.category || 'general',
    products: []
  };

  // Add products to frontmatter
  if (data.products && data.products.length > 0) {
    frontmatterObj.products = data.products.map(product => ({
      asin: product.asin || 'B0XXXXX',
      name: product.name,
      image: product.image || fallbackImage || 'https://hips.hearstapps.com/hmg-prod/images/placeholder-1.jpg',
      affiliateLink: `https://www.amazon.es/dp/${product.asin || 'B0XXXXX'}?tag=oferta-limitada-21`,
      price: product.price || '39,99 €',
      destacado: product.destacado || 'Producto recomendado',
      potencia: product.potencia || 'N/A',
      capacidad: product.capacidad || 'N/A',
      velocidades: product.velocidades || 'N/A',
      funciones: product.funciones || 'Funciones básicas',
      pros: product.pros || 'Calidad, Precio, Durabilidad',
      cons: product.cons || 'Ninguna desventaja significativa',
      description: product.description || 'Descripción breve del producto',
      detailedDescription: product.detailedDescription || 'Descripción detallada del producto con sus principales características.'
    }));
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

  if (data.content?.intro) {
    bodyContent += `## Introducción\n\n${data.content.intro}\n\n`;
  }

  bodyContent += `## Consejos antes de comprar\n\n`;
  bodyContent += `${data.content?.buying_tips || 'Antes de realizar tu compra, considera factores como el precio, la calidad y las características que necesitas.'}\n\n`;

  bodyContent += `## Valoraciones\n\n`;
  data.products?.forEach((product, index) => {
    bodyContent += `<ProductDetailCard product={products[${index}]} />\n\n`;
  });

  bodyContent += `## Conclusión\n\n`;
  bodyContent += `${data.content?.conclusion || 'Esperamos que esta guía te haya ayudado a encontrar el producto perfecto para tus necesidades.'}\n`;

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

// Ejecutar el script
main().catch(error => {
  console.error('❌ Error global:', error);
  process.exit(1);
});
