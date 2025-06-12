const ParseProducts = (products) => {
    
    const affiliateLink = asin 
    ? `https://www.amazon.es/dp/${asin}?tag=oferta-limitada-21`
    : `https://www.amazon.es/s?k=${encodeURIComponent(name)}&tag=oferta-limitada-21`;

    const product = {
      name,
      description,
      price,
      affiliateLink,
      asin,
      image: {
        '@type': 'ImageObject',
        'url': imageUrl,
        'caption': `${name}`
      },
      pros,
      cons,
      pros,
      cons,
      brand: {
        '@type': 'Brand',
        name: block.match(/Marca:?\s*([^\n]+)/i)?.[1]?.trim() || 'Marca no especificada'
      },
      offers: {
        '@type': 'Offer',
        price: price !== 'Precio no disponible' ? parseFloat(price.replace(/[^0-9,.]/g, '').replace(',', '.')) || 0 : 0,
        priceCurrency: 'EUR',
        availability: 'http://schema.org/InStock',
        url: affiliateLink, 
        priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      },
      review: {
        '@type': 'Review',
        author: {'@type': 'Person', name: 'Análisis del Experto'},
        datePublished: new Date().toISOString().split('T')[0],
        reviewRating: {
          '@type': 'Rating',
          ratingValue:  '4.5',
          bestRating: '5'
        },
        reviewBody: description || 'Análisis detallado del producto.'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.0',
        reviewCount: '5'
      }
    };
    
    products.push(product);
  
  return products;
}

export { ParseProducts };