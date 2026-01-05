import { contentProcessingAI } from './openaiService.js';
import { generateFrontmatter } from './generateFrontmatter.js';

export async function generateMDX(data) {
    console.log(`🤖 Generando MDX para "${data.title}"...`);

    try {
        // Step 1: Process content to extract products, generate destacados, and assign category
        const processedData = await contentProcessingAI(data);

        if (!processedData.products || processedData.products.length < 3) {
            console.warn(`⚠️ Se encontraron ${processedData.products?.length || 0} productos. Se necesitan al menos 3 productos.`);
            return null;
        }

        console.log(processedData)

        // Step 2: Generate frontmatter with the processed data
        const frontmatter = await generateFrontmatter(data, processedData);

        // Step 3: Generate the MDX content
        const mdxContent = generateMDXContent(data, processedData, frontmatter);

        console.log('✅ Archivo MDX creado correctamente');
        return mdxContent;
    } catch (error) {
        console.error('❌ Error al generar MDX:', error.message);
        return null;
    }
}


function generateMDXContent(data, processedData, frontmatter) {
    // Create MDX content
    const productsVar = 'products';
    
    // Crear sección de análisis comparativo si existe
    let comparativaSection = '';
    if (processedData.comparativa) {
        comparativaSection = `
## Análisis Comparativo

${processedData.comparativa}

`;
    }
    
    // Crear sección de FAQ si existe
    let faqSection = '';
    if (Array.isArray(processedData.faq) && processedData.faq.length > 0) {
        faqSection = `
## Preguntas Frecuentes

${processedData.faq.map(faq => (
            `### ${faq.question}

${faq.answer}

`
        )).join('')}`;
    }
    
    const mdxContent = `---json
${frontmatter}
---

# ${processedData.title}


${processedData.introduction}

## 

<ProductRankingTable products={${productsVar}} />

## 

${processedData.products.map((_, index) => `<ProductDetailCard product={${productsVar}[${index}]} index={${index}} />

`).join('')}

${comparativaSection}

${faqSection}

## Conclusión

${processedData.conclusion}
`;

    return mdxContent;
}