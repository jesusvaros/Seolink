import fs from 'fs';
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

EJEMPLO EXACTO DE CÓMO DEBE EMPEZAR (sin espacios al inicio):

---
title: "Título del artículo"
date: "YYYY-MM-DD"
slug: "slug-con-guiones"
image: "https://url-de-la-imagen.jpg"
excerpt: "Resumen útil del artículo"
products:
  - asin: "ID de Amazon"
    name: "Nombre del producto"
    image: "https://..."
    affiliateLink: "https://www.amazon.es/dp/ASIN?tag=oferta-limitada-21" # IMPORTANTE: Usa SIEMPRE este tag y reemplaza ASIN con el código del producto
    price: "Numero visible del precio, si no encuentras el precio estimalo con el precio de Amazon siempre debe ser numerico con moneda €"
    # Propiedad destacada para la tabla de ranking
    destacado: "La más barata" # O "La mejor relación calidad-precio", "La más potente", "La más ligera", etc.
    # Propiedades importantes para la tabla comparativa (MÁXIMO 4 propiedades)
    # SOLO incluye las propiedades más relevantes para este tipo de producto específico
    # Ejemplos de propiedades según el tipo de producto:
    # - Para batidoras: potencia: "xx W", capacidad: "xx L", velocidades: "número", funciones: "value"
    # - Para aspiradoras: potencia: "xx W", autonomía: "xx min", capacidad: "xx L", nivel_ruido: "xx dB"
    # - Para hornos: capacidad: "xx L", temperatura_máx: "xxx°C", programas: "número", consumo: "valor"
    # - Para ropa: material: "tipo", tallas: "rango", colores: "opciones", estilo: "descripción"
    # - Para comida: ingredientes: "lista", calorías: "valor", origen: "país/región", conservación: "método"
    # - Para plantas: tipo: "interior/exterior", riego: "frecuencia", luz: "requerimientos", tamaño: "cm"
    # Asegúrate de seleccionar solo las 4 propiedades más importantes para este producto y eliminar el resto
    # Otros datos importantes
    pros: "Ventaja 1, Ventaja 2, Ventaja 3"
    cons: "Desventaja 1, Desventaja 2"
    description: "Descripción corta"
    detailedDescription: "Descripción más detallada de unas 2-3 frases sobre el producto principales características, ventajas y casos de uso. Esto debe ser un texto explicativo, no una lista."
    # Si hay otras propiedades importantes para el tipo de producto, añádelas aquí
    # Elimina las propiedades que no sean relevantes para ese tipo de producto
---

---

# BODY DEL ARTÍCULO

Después del frontmatter, el cuerpo debe estar en **Markdown + JSX válido**. Sigue esta estructura obligatoria:

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

// MAIN
const urls = ['https://www.elle.com/es/gourmet/gastronomia/g41931720/mejores-batidoras-vaso/'
  , 'https://www.elle.com/es/gourmet/gastronomia/g61673965/mejores-batidoras-de-mano-analisis-comparativa/',
  'https://www.elle.com/es/belleza/cara-cuerpo/g38450525/mejores-serum-vitamina-c/'
];

const OUTPUT_DIR = '../content/posts';

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const url of urls) {
  try {
    console.log(`🔍 Procesando ${url}...`);
    const data = await fetchCleanContent(url);

    if (!data.content || data.content.length < 100) {
      console.error(`❌ Contenido insuficiente para: ${url} `);
      continue;
    }

    const mdx = await generateMDX(data);
    const slug = slugify(data.title, { lower: true, strict: true });
    fs.writeFileSync(`${OUTPUT_DIR}/${slug}.mdx`, mdx);
    console.log(`✅ Guardado en: ${OUTPUT_DIR}/${slug}.mdx`);
  } catch (err) {
    console.error(`❌ Error en ${url}:`, err.message);
  }
}
