/**
 * Service for generating video scripts from MDX content using OpenAI
 */
import OpenAI from 'openai';
import fs from 'fs-extra';
import path from 'path';
import { ProcessedMarkdown } from './mdxProcessor.js';
import dotenv from 'dotenv';
import { remark } from 'remark';
import strip from 'strip-markdown';

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProductInfo {
  name: string;
  price: string;
  pro: string; // First PRO feature
}

/**
 * Generate a script for a TikTok video using the processed MDX content
 */
export async function generateScript(processedMarkdown: ProcessedMarkdown, outputPath: string): Promise<string> {
  console.log('Generating script with OpenAI...');
  try {
    // Extract top 5 products with their first PRO feature
    const products = extractProductInfo(processedMarkdown.products);
    
    const context = `
      Título del artículo: ${processedMarkdown.title || 'Product Review'}
      
      Imagen principal: ${processedMarkdown.image || 'No image available'}
      
      Productos:
      ${products.slice(0, 5).map((p, i) => `${i + 1}. ${p.name}: ${p.price} - Característica: ${p.pro}`).join('\n')}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
        Eres un experto en marketing viral que crea guiones para TikTok que serán leídos por una voz sintética (IA con estilo dinámico). 
        Tu tarea es generar un guion dividido en secciones estructuradas para crear un vídeo de 30 a 45 segundos de duración.
        
        Devuelve la respuesta en formato **estrictamente JSON**, con esta estructura:
        
        {
          "intro": "string",
          "productos": ["string", "string", "string", "string", "string"...],
          "outro": "string + "Mas en comparaland punto es."
        }
        
        Instrucciones específicas:
        - La intro debe captar la atención en los primeros 2 segundos con un gancho exagerado o emocional no debe durar mas de 3 segundos ejemplos: top 10 vestidos para verano 2025, los mejores smartwatch para 2025, el mejor regalo para niños de 2025, los mejores productos de 2025, ...etc.
        - Cada producto debe tener una frase única, oral, rápida y emocional. Menciona solo un beneficio clave para que cada producto no dure mas de 4 segundos.
        - La outro debe ser una llamada a la acción tipo: “¿Cuál es tu favorito? ¡Comenta abajo!” o similar.
        - No incluyas etiquetas, aclaraciones ni saltos de línea. Solo el JSON plano como respuesta.
        - Usa un estilo enérgico, con ritmo TikTok, lenguaje directo y exagerado.
        - Al final de la outro debe ir "Mas en comparaland punto es."
          `.trim()
        },
        {
          role: "user",
          content: `Usa esta información para generar el guion del vídeo: ${context}`
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const script = completion.choices[0]?.message?.content?.trim() || 'No script could be generated.';
    console.log('Script generado:', script);
    
    // Create directory if it doesn't exist and save the script
    try {
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, script);
      console.log(`Script guardado en: ${outputPath}`);
    } catch (writeError) {
      console.error(`Error al guardar el script: ${writeError}`);
    }

    return script;
  } catch (error) {
    console.error('Error al generar el guión con OpenAI:', error);
    throw error;
  }
}

/**
 * Extract product information from the product data
 * For each product, get the name, price, and first PRO feature
 */
function extractProductInfo(products: any[] = []): ProductInfo[] {
  return products.slice(0, 5).map(product => {
    // Handle different product formats
    let productObj: any;
    
    try {
      if (typeof product === 'string') {
        try {
          // Try to parse if it's a JSON string
          productObj = JSON.parse(product);
        } catch {
          // If not valid JSON, it might be just the name
          return { name: product, price: 'N/A', pro: '' };
        }
      } else {
        productObj = product;
      }
      
      // Extract the first PRO feature
      let firstPro = '';
      if (productObj.pro) {
        firstPro = productObj.pro;
      } else if (productObj.pros && Array.isArray(productObj.pros) && productObj.pros.length > 0) {
        firstPro = productObj.pros[0];
      } else if (productObj.destacado) {
        firstPro = productObj.destacado;
      }
      
      return {
        name: productObj.name || productObj.title || 'Producto',
        price: productObj.price || 'N/A',
        pro: firstPro
      };
    } catch (error) {
      console.warn('Error parsing product:', error);
      return { name: 'Producto desconocido', price: 'N/A', pro: '' };
    }
  });
}

/**
 * Extract plain text from markdown content
 */
async function extractTextFromMarkdown(markdown: string): Promise<string> {
  // Use remark and strip-markdown to convert markdown to plain text
  const result = await remark()
    .use(strip)
    .process(markdown);
  
  return String(result);
}

