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
Transforma este contenido web en un archivo .mdx para una web de afiliados. Sigue estrictamente estas reglas y estructura de componentes React compatibles con Next.js y MDX.

Empieza siempre el archivo con tres guiones ---, no uses bloques de código. Todos los campos de texto deben ir entre comillas dobles. La estructura es:

---
title: "Título del artículo"
date: "YYYY-MM-DD"
slug: "slug-con-guiones"
image: "https://url-de-la-imagen.jpg"
excerpt: "Resumen útil del artículo"
products:
  - asin: "B00XYZ..."
    name: "Nombre del producto"
    image: "https://..."
    affiliateLink: "https://..."
    price: "Texto visible del precio"
    # Propiedades importantes que se mostrarán en la tabla
    capacity: "xx L"
    potencia: "xx W"
    dimensiones: "xx x xx x xx cm"
    peso: "xx kg"
    # Si es aplicable para electrodomésticos de cocina
    vapor: true/false    # solo incluir si es relevante para el tipo de producto
    limpieza: "Texto sobre limpieza"
    # Propiedades para detalles
    pros: "Ventaja 1, Ventaja 2, Ventaja 3"
    cons: "Desventaja 1, Desventaja 2"
    detailedDescription: "Descripción completa del producto con al menos 2-3 frases sobre sus principales características, ventajas y casos de uso. Esto debe ser un texto explicativo, no una lista."
    # Si hay otras propiedades importantes para el tipo de producto, añádelas aquí
    # Elimina las propiedades que no sean relevantes para ese tipo de producto
---

---

# BODY DEL ARTÍCULO

Después del frontmatter, el cuerpo debe estar en **Markdown + JSX válido**. Sigue esta estructura obligatoria:

## # Título principal (H1)
Debe repetir el título del frontmatter

## ## Comparativa rápida

Aquí usa este componente JSX (sin usar frontMatter):

<ProductTable products={products} />

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

## ## Conclusión

Cierra con una invitación directa y útil a que el usuario compare y compre. Termina con un tono útil y motivador.

---

# PROHIBIDO:

- NO uses HTML como <div>, <img>, <dl>, ni variables tipo frontMatter.products
- NO pongas JSX en el frontmatter
- NO uses referencias inexistentes

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
,  'https://www.elle.com/es/gourmet/gastronomia/g61673965/mejores-batidoras-de-mano-analisis-comparativa/'
];

const OUTPUT_DIR = '../content/posts';

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const url of urls) {
  try {
    console.log(`🔍 Procesando ${ url }...`);
    const data = await fetchCleanContent(url);

    if (!data.content || data.content.length < 100) {
      console.error(`❌ Contenido insuficiente para: ${ url } `);
      continue;
    }

    const mdx = await generateMDX(data);
    const slug = slugify(data.title, { lower: true, strict: true });
    fs.writeFileSync(`${ OUTPUT_DIR }/${slug}.mdx`, mdx);
    console.log(`✅ Guardado en: ${OUTPUT_DIR}/${slug}.mdx`);
} catch (err) {
    console.error(`❌ Error en ${url}:`, err.message);
}
}
