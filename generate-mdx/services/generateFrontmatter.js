export async function generateFrontmatter(data,processedData) {
    console.log('📝 Generando frontmatter para MDX...');
    
    try {
      const slug = processedData.title
        .toLowerCase()
        // Normalize accented characters to their ASCII equivalents
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Replace non-alphanumeric characters (except spaces) with empty string
        .replace(/[^\w\s-]/g, '')
        // Replace spaces with hyphens
        .replace(/\s+/g, '-')
        // Replace multiple hyphens with a single hyphen
        .replace(/--+/g, '-')
        // Remove leading and trailing hyphens
        .replace(/^-+|-+$/g, '');
        
      console.log(`🔤 Slug generado: ${slug}`);
      
      const category = processedData.category || 'productos';
      
      const frontmatterObj = {
        title: processedData.title,
        slug,
        date: new Date().toISOString().split('T')[0],
        category,
        image: data.image,
        conclusion: processedData.conclusion,
        excerpt: processedData.excerpt,
        comparativa: processedData.comparativa,
        // Incluir FAQ si está disponible
        faq: Array.isArray(processedData.faq) ? processedData.faq : [],
        products: processedData.products.map((p,index) => {
         const price = data.productPrices[index]
          
          // Get today's date for defaults
          const today = new Date().toISOString().split('T')[0];
          const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
          
          // Find the matching product from our extracted data using ASIN or product name
          const extractedProduct = data.productPrices.find(ep => 
            (p.asin && ep.asin === p.asin) || 
            (ep.text && p.name && ep.text.includes(p.name.substring(0, 15)))
          );
          
          return {
            name: p.name,
            asin: p.asin || '',
            // Prioritize the image from our extraction over the one from OpenAI
            image: (extractedProduct && extractedProduct.image) ? extractedProduct.image : (p.image || ''),
            price: `${price.priceValue} ${price.currency}`,
            affiliateLink: (p.asin ? `https://www.amazon.es/dp/${p.asin}?tag=oferta-limitada-21` : '#'),
            destacado: p.destacado || 'Producto destacado',
            pros: Array.isArray(p.pros) ? p.pros : [],
            cons: Array.isArray(p.cons) ? p.cons : [],
            especificaciones: Array.isArray(p.especificaciones) ? p.especificaciones : [],
            analisis: p.analisis || 'Análisis del producto',
            brand: p.brand || {
              '@type': 'Brand',
              name: 'Marca no especificada'
            },
            offers: {
              '@type': 'Offer',
              price: `${price.priceValue}.00`,
              priceCurrency: 'EUR',
              availability: 'http://schema.org/InStock',
              url: p.asin ? `https://www.amazon.es/dp/${p.asin}?tag=oferta-limitada-21` : '#',
              priceValidUntil: nextYear
            },
            review: p.review || {
              '@type': 'Review',
              author: {'@type': 'Person', name: 'Análisis del Experto'},
              datePublished: today,
              reviewRating: {
                '@type': 'Rating',
                ratingValue: '4.5',
                bestRating: '5'
              },
              reviewBody: p.description || 'Análisis detallado del producto.'
            },
            aggregateRating: p.aggregateRating || {
              '@type': 'AggregateRating',
              ratingValue: '4.0',
              reviewCount: '5'
            }
          };
        })
      };
      
      // Return properly formatted JSON
      return JSON.stringify(frontmatterObj, null, 2);
  } catch (error) {
    console.error('❌ Error al generar frontmatter:', error.message);
    return null;
  }
}