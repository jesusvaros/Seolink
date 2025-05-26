import React from 'react';
import { Product } from './ProductTable';

type ProductHeadingProps = {
  product: Product;
  index?: number;
  feature?: string;
};

const ProductHeading: React.FC<ProductHeadingProps> = ({ product, index = 1, feature }) => {
  // Si no se proporciona una característica específica, usar el primer pro del producto
  const displayFeature = feature || (product.pros ? product.pros.split(',')[0].trim() : 'Producto destacado');
  
  return (
    <div className="product-heading">
      <h3 className="product-title">
        <span className="product-number">{index}</span>
        <span className="product-name">{product.name}</span>
      </h3>
      <p className="product-feature">{displayFeature}</p>
    </div>
  );
};

export default ProductHeading;
