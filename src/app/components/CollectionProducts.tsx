import { useEffect, useState } from 'react';
import { getProductsByCollection } from '../../lib/shopify';
import { CatalogPage } from './CatalogPage';

function formatCollectionTitle(handle: string) {
  return handle
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function CollectionProducts({ handle }: { handle: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);

      try {
        const data = await getProductsByCollection(handle);
        setProducts(data?.products || []);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [handle]);

  if (loading) {
    return (
      <section className="container mx-auto px-6 py-16">
        <p className="text-[#717182]">Loading collection products...</p>
      </section>
    );
  }

  return (
    <CatalogPage
      customProducts={products}
      title={formatCollectionTitle(handle)}
      description="Browse and filter products available in this collection."
    />
  );
}