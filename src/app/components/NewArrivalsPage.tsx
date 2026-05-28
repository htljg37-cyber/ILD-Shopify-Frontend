import { useEffect, useMemo, useState } from 'react';
import { CatalogPage } from './CatalogPage';
import { getProducts } from '../../lib/shopify';

export function NewArrivalsPage() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function loadProducts() {
      const data = await getProducts();
      setProducts(data);
    }

    loadProducts();
  }, []);

  const newProducts = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filtered = products.filter((product) => {
      if (!product.createdAt) return false;
      return new Date(product.createdAt) >= thirtyDaysAgo;
    });

    return filtered.length > 0 ? filtered : products.slice(0, 12);
  }, [products]);

  return (
    <CatalogPage
      customProducts={newProducts}
      title="New Arrivals"
      description="Explore our latest product drops, recently added items, and fresh premium finds from IL Distributions LLC."
    />
  );
}