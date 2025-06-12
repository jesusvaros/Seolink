import { contentProcessingAI } from './openaiService.js';
import { generateFrontmatter } from './generateFrontmatter.js';

export async function generateMDX(data) {
    console.log(`🤖 Generando MDX para "${data.title}"...`);

    try {
        // Step 1: Process content to extract products, generate destacados, and assign category
        const processedData = await contentProcessingAI(data);

        if (!processedData.products || processedData.products.length === 0) {
            console.warn('⚠️ No se encontraron productos de Amazon válidos.');
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
    const mdxContent = `---json
${frontmatter}
---

# ${processedData.title}


${processedData.introduction}

## Tabla comparativa

<ProductRankingTable products={${productsVar}} />

## Valoraciones

${processedData.products.map((_, index) => `<ProductDetailCard product={${productsVar}[${index}]} />

`).join('')}## Conclusión

${processedData.conclusion}
`;

    return mdxContent;

}