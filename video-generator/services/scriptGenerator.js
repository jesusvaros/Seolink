import OpenAI from 'openai';
import dotenv from 'dotenv';
import * as fs from 'fs/promises';
import path from 'path';

dotenv.config();

// Inicializar el cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateScript(title, excerpt, products, outputPath) {
  console.log('Generando guión con OpenAI...',outputPath)
  try {

    const context = `
      Título del artículo: ${title}
      
      Resumen: ${excerpt}
      
      Productos:
      ${products.slice(0, 5).map((p, i) => `${i + 1}. ${p.name}: ${p.price} ${p.destacado}`).join('\n')}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
      Eres un experto en marketing viral y creas guiones para TikTok que serán leídos por una voz sintética (IA con estilo dinámico). 
      Tu misión es crear un guion que dure entre 30 y 45 segundos.
      Debe tener:
      - Un gancho impactante en los 2 primeros segundos.
      - Una frase corta y atractiva por producto (máximo 5 productos).
      - Ritmo rápido, lenguaje oral, sin tecnicismos.
      - Una llamada a la acción al final que anime a descubrir más o comentar.
      No pongas saltos de línea, ni encabezados, ni explicaciones. El texto se usará directamente como voz en off. Sonríe con el tono, exagera si hace falta.
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

const script = completion.choices[0].message.content.trim();
console.log('Script generado:', script);
    
    // Crear el directorio si no existe
    try {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, script);
      console.log(`Script guardado en: ${outputPath}`);
    } catch (writeError) {
      console.error(`Error al guardar el script: ${writeError.message}`);
      // Continuamos con el script generado aunque no se pueda guardar
    }

    return script;
  } catch (error) {
    console.error('Error al generar el guión con OpenAI:', error);
  }
}

