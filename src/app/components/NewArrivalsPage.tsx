import { useEffect, useMemo, useState } from 'react';
import { CatalogPage } from './CatalogPage';
import { getProducts } from '../../lib/shopify';

export function NewArrivalsPage() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function loadProducts() {
      const data = await getProducts();

      const normalizedProducts = data.map((product: any) => ({
        ...product,
        isOutOfStock: product?.isOutOfStock || !product?.availableForSale,
      }));

      setProducts(normalizedProducts);
    }

    loadProducts();
  }, []);

  const newProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
      })
      .slice(0, 20);
  }, [products]);

  return (
    <CatalogPage
      customProducts={newProducts}
      title="New Arrivals"
      description="Discover the latest products recently added to our catalog. New arrivals are automatically updated as new items are published."
    />
  );
}