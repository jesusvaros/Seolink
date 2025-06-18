import { OpenAI } from 'openai';
import { config } from 'dotenv';

// Initialize environment variables
config();

// Initialize OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function contentProcessingAI(data) {
  console.log('🔍 Iniciando procesamiento unificado del contenido...');
  console.log('Contenido:', data.content);
  console.log('Array de precios:', data.productPrices);
  console.log(data);
  try {
    const prompt = `
      Analiza el siguiente contenido y realiza las siguientes tareas:

      1. EXTRACCIÓN DE PRODUCTOS: Extrae TODOS los productos de Amazon mencionados en el contenido.
      Para cada producto, proporciona:
      - name - nombre del producto
      - description - descripción breve
      - price - precio
      - link - enlace de Amazon
      - asin - ASIN
      - image - imagen
      - brand - marca 
      - pros - Lista de 3-4 puntos fuertes
      - cons - Lista de 1-3 puntos débiles
      - destacado - Para cada producto extraído, genera una frase corta y atractiva (máximo 5 palabras) que destaque la característica principal o el beneficio más importante del producto. Las frases deben ser impactantes y persuasivas, ideales para mostrar como "destacado" en una página de producto.Ejemplos: "El más potente", "Mejor relación calidad-precio", "Ideal para principiantes"
      - especificaciones - Lista de especificaciones relevantes entre  del producto 3 y 6 las cuales deben tener nombre de la especificación y valor de la especificación
      - analisis - Genera un análisis detallado del producto, incluyendo sus ventajas y desventajas, y cómo se compara con otros productos similares debe ser un texto de al menos dos parrafos.
      
      2. category:
      Asigna una categoría adecuada al contenido. 
      Elige entre: tecnologia, hogar, belleza, deportes, mascotas, jardin, cocina, moda, juguetes, libros.

      3. conclusion:
      Genera una conclusión de al menos dos parrafos con la información más relevante del contenido.

      4. introduction:
      Genera una introducción de al menos dos parrafos con la información más relevante del contenido.

      5.titulo:
      Genera un título para el artículo que sea atractivo y que refleje el contenido del artículo para long-tail keywords.
      
      Contenido:
      ${data.content}
      Array de precios de los productos, el numero total de productos es de ${data.productPrices.length} y los precios son los siguientes:
      ${data.productPrices}


      FORMATO DE RESPUESTA (en JSON):
      {
        "category": "nombre_de_categoría",
        "introduction": "Introducción",
        "conclusion": "Conclusión",
        "title": "titulo",
        "products": [
          {
            "name": "Nombre del producto",
            "description": "Descripción del producto",
            "price": "Precio",
            "link": "URL del producto",
            "brand": "Marca del producto",
            "pros": ["Ventaja 1", "Ventaja 2", "Ventaja 3"],
            "cons": ["Desventaja 1", "Desventaja 2"],
            "destacado": "Frase destacada",
            "asin": "ASIN del producto",
            "image": "URL de la imagen del producto",
            "analisis": "Análisis del producto",
            "especificaciones": [
              {
                "nombre": "Nombre de la especificación",
                "valor": "Valor de la especificación"
              },
              {
                "nombre": "Nombre de la especificación",
                "valor": "Valor de la especificación"
              } ...
            ]
          }
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres un asistente especializado en análisis de productos, marketing y categorización de contenido. Generas contenido para una web que quiere pelear por el seo de long-tail keywords.  Responde en formato JSON. Extrae siempre TODOS los productos mencionados en el contenido." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 10000
    });

    // Get the response content
    const content = response.choices[0].message.content;
    console.log('\ud83d\udd0d Respuesta recibida de OpenAI, intentando parsear JSON...');
    console.log('content',content);
    let responseData;
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]+?)\s*```/) ||
        content.match(/\{[\s\S]*\}/);

      const jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      responseData = JSON.parse(jsonContent);

      console.log(`\u2705 JSON parseado correctamente. Encontrados ${responseData.products?.length || 0} productos.`);
    } catch (error) {
      console.error('\u274c Error al parsear JSON:', error.message);
      console.log('Contenido de la respuesta:', content.substring(0, 200) + '...');
    }

    console.log(`\u2705 Procesamiento unificado completado: ${responseData.products.length} productos encontrados, categoría: ${responseData.category || 'productos'}`);

    console.log(responseData.products)

    return {
      products: responseData.products,
      category: responseData.category || 'productos',
      title: responseData.title,
      conclusion: responseData.conclusion,
      introduction: responseData.introduction
    };
  } catch (error) {
    console.error('❌ Error en el procesamiento unificado:', error.message);
  }
}


