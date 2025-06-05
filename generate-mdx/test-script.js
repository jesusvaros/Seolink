// generate-mdx/test-script.js
import { generateMDX } from './index.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.local' }); // To load OPENAI_API_KEY

async function runTest() {
  const sampleData = {
    title: "Comparativa Definitiva: Los 5 Mejores Robots Aspiradores para Pelo de Mascota en 2024",
    content: `
      <h1>Guía Completa de Robots Aspiradores para Dueños de Mascotas</h1>
      <p>Si compartes tu vida con amigos peludos, sabes que mantener la casa limpia de pelos es una batalla constante. Un buen robot aspirador puede ser tu mejor aliado. En esta comparativa, analizamos los modelos más destacados del mercado, enfocándonos en su capacidad para lidiar con el pelo de animal, su potencia de succión, sistemas de filtración y facilidad de mantenimiento.</p>
      
      <h2>1. Roomba s9+ (Plus)</h2>
      <p>El Roomba s9+ es el buque insignia de iRobot y una bestia contra el pelo de mascota. Su diseño en forma de D le permite alcanzar mejor las esquinas. Destaca por su potente succión y la estación de autovaciado Clean Base, que te permite olvidarte de vaciar el depósito durante semanas. Sus cepillos de goma duales son excelentes para no enredar pelos largos. Precio aproximado: 899 EUR.</p>
      
      <h2>2. Roborock S7 MaxV Ultra</h2>
      <p>Este modelo de Roborock no solo aspira con una potencia impresionante (5100 Pa), sino que también friega con vibración sónica. Su sistema de evasión de obstáculos ReactiveAI 2.0 es muy avanzado, ideal si tus mascotas dejan juguetes por el suelo. También cuenta con una base de autovaciado, autollenado de agua y autolimpieza de la mopa. Precio: unos 1200 EUR.</p>
      
      <h2>3. Ecovacs Deebot X1 Omni</h2>
      <p>El Deebot X1 Omni es otro contendiente de gama alta con una estación todo en uno que vacía el polvo, rellena el agua y limpia y seca las mopas. Ofrece una gran potencia de succión y navegación LiDAR precisa. Su asistente de voz YIKO es un plus. Precio: alrededor de 1100 EUR.</p>
      
      <h2>4. Dreame L10s Ultra</h2>
      <p>Similar en prestaciones al Roborock y Ecovacs, el Dreame L10s Ultra ofrece una potente succión de 5300Pa y una estación base multifuncional. Es conocido por su buena relación calidad-precio dentro de la gama alta. Sus cepillos están diseñados para minimizar enredos. Precio: 950 EUR.</p>

      <h2>5. Cecotec Conga 9090 AI</h2>
      <p>Una opción más asequible pero muy competente. La Conga 9090 AI de Cecotec ofrece navegación láser, buena potencia de succión y fregado. Aunque su estación no es tan completa como las de gama premium, cumple bien su función. Es una marca española con buen soporte. Precio: 450 EUR.</p>

      <p>Esperamos que esta comparativa te ayude a elegir el mejor robot aspirador para mantener tu hogar libre de pelos y disfrutar más de tus mascotas.</p>
    `,
    url: "https://www.example.com/articulos/mejores-robots-aspiradores-mascotas-2024",
    date: "2024-01-15", // Original article date
    image: "https://www.example.com/images/default-robots.jpg"
  };

  console.log("🧪 Iniciando prueba de generación de MDX...");
  try {
    const mdxOutput = await generateMDX(sampleData);
    console.log("\n📄 Contenido MDX Generado:\n");
    console.log(mdxOutput);
    console.log("\n✅ Prueba finalizada.");
  } catch (error) {
    console.error("\n❌ Error durante la prueba de generación de MDX:", error);
  }
}

runTest();
