
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
  const prompt = `
INSTRUCCIÓN: Crea un archivo MDX para una web de afiliados siguiendo exactamente este formato:

1. NUNCA uses marcas de código tipo \`\`\`mdx o \`\`\`markdown
2. El archivo debe comenzar EXACTAMENTE con tres guiones --- sin espacios antes
3. No uses ninguna comilla invertida (\`) en todo el archivo
4. Todos los campos del frontmatter deben ir entre comillas dobles
5. IMPORTANTE: Los comentarios en YAML deben comenzar con # y estar en la MISMA LÍNEA del campo que comentan, NUNCA en una línea separada
6. NO incluyas comentarios multilínea que comiencen con #
7. Elimina todos los comentarios de ejemplo en tu respuesta final, sólo incluye los datos necesarios

EJEMPLO EXACTO DE CÓMO DEBE EMPEZAR (sin espacios al inicio):

---
title: "Título del artículo"
date: "YYYY-MM-DD"
slug: "slug-con-guiones"
image: "https://url-de-la-imagen.jpg"
excerpt: "Resumen útil del artículo"
category: "cocina"
products:
  - asin: "ID de Amazon"
    name: "Nombre del producto"
    image: "https://..."
    affiliateLink: "https://www.amazon.es/dp/ASIN?tag=oferta-limitada-21"
    price: "Numero visible del precio con moneda €"
    destacado: "La más barata"
    potencia: "xx W"
    capacidad: "xx L"
    velocidades: "número"
    funciones: "value"
    pros: "Ventaja 1, Ventaja 2, Ventaja 3"
    cons: "Desventaja 1, Desventaja 2"
    description: "Descripción corta"
    detailedDescription: "Descripción más detallada de unas 2-3 frases sobre el producto principales características, ventajas y casos de uso."
---

---

# BODY DEL ARTÍCULO

Después del frontmatter, el cuerpo debe estar en **Markdown + JSX válido**. 

Debes incluir estos imports al principio del archivo (después de las triple rayas del frontmatter):

import ProductDetailCard from '../components/ProductDetailCard'
import ProductTable from '../components/ProductTable'
import ProductRankingTable from '../components/ProductRankingTable'
import ProductHeading from '../components/ProductHeading'
import ArticleCard from '../components/ArticleCard'

Sigue esta estructura obligatoria:

## # Título principal (H1)
Debe repetir el título del frontmatter

## ## Resumen de los mejores productos

Inserta primero una tabla de ranking con las características destacadas de cada producto:

<ProductRankingTable products={products} />

## ## Consejos antes de comprar

Incluye contenido SEO útil que venga del artículo original: cómo elegir, errores comunes, diferencias entre tipos, etc.

## ## Valoraciones 

Comparte texto general sobre opiniones o experiencia, como haría un autor experto o un blog confiable.

## ## Análisis detallado

Después de la tabla, añade una sección para cada producto con su análisis detallado. Asegúrate de numerarlos para mantener la coherencia con la tabla. Usa el siguiente formato para cada producto (reemplaza "Nombre del producto" con el nombre exacto del producto y "index" con su número):

<ProductHeading product={products.find(p => p.name === "Nombre del producto")} index={1} />

Aquí agrega una pequeña introducción del producto (1-2 frases).

<ProductDetailCard product={products.find(p => p.name === "Nombre del producto")} />

Repite esta estructura para cada producto, usando un encabezado H3 y el componente ProductDetailCard para cada uno.

## ## Comparativa técnica completa

Antes de tomar tu decisión final, compara todas las especificaciones técnicas de los productos analizados:

<ProductTable products={products} />

## ## Conclusión

Cierra con una invitación directa y útil a que el usuario compare y compre. Termina con un tono útil y motivador.

---

# PROHIBIDO:

- NO uses HTML como <div>, <img>, <dl>, ni variables tipo frontMatter.products
- NO pongas JSX en el frontmatter
- NO uses referencias inexistentes
- NUNCA uses otro tag que no sea "oferta-limitada-21" en los enlaces de afiliados de Amazon
- SIEMPRE utiliza el formato https://www.amazon.es/dp/ASIN?tag=oferta-limitada-21 para TODOS los enlaces de afiliados

---

CONTENIDO BASE:

Título: ${title}
Fecha: ${date}
URL: ${url}

Texto extraído del artículo:
${markdown}
`;


  const chat = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });

  return chat.choices[0].message.content;
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
  const frontMatterRegex = /---\n([\s\S]*?)\n---/;
  const match = mdxContent.match(frontMatterRegex);
  
  if (!match || !match[1]) {
    throw new Error('No se pudo extraer el frontmatter del MDX generado');
  }
  
  const frontMatter = match[1];
  
  // Extraer cada campo del frontmatter
  const titleMatch = frontMatter.match(/title: "([^"]+)"/); 
  const slugMatch = frontMatter.match(/slug: "([^"]+)"/); 
  const imageMatch = frontMatter.match(/image: "([^"]+)"/); 
  const categoryMatch = frontMatter.match(/category: "([^"]+)"/); 
  
  if (!titleMatch || !slugMatch || !imageMatch || !categoryMatch) {
    throw new Error('Falta información requerida en el frontmatter');
  }
  
  return {
    title: titleMatch[1],
    slug: slugMatch[1],
    image: imageMatch[1],
    category: categoryMatch[1]
  };
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
      const data = await fetchCleanContent(url);

      if (!data.content || data.content.length < 100) {
        console.error(`❌ Contenido insuficiente para: ${url}`);
        continue;
      }

      const mdx = await generateMDX(data);
      const slug = slugify(data.title, { lower: true, strict: true });
      const outputPath = `${OUTPUT_DIR}/${slug}.mdx`;
      fs.writeFileSync(outputPath, mdx);
      console.log(`✅ Guardado en: ${outputPath}`);
      
      // Extraer metadatos y actualizar categories.json
      try {
        const metadata = extractMetadataFromMDX(mdx);
        await updateCategoriesJson(metadata);
      } catch (metadataError) {
        console.error(`❌ Error al actualizar categories.json:`, metadataError.message);
      }
      
      // Añadir URL a la lista de procesadas
      processedUrls.push(url);
      
      // Guardar la lista actualizada después de cada artículo
      fs.writeFileSync(PROCESSED_URLS_FILE, JSON.stringify(processedUrls, null, 2));
      
      // Añadir un pequeño retraso entre peticiones para no sobrecargar el servidor
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error al procesar ${url}:`, error.message);
    }
  }
}

// Ejecutar la función principal
main().catch(error => {
  console.error('❌ Error general:', error.message);
  process.exit(1);
});
