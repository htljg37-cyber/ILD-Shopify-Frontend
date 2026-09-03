import { useEffect, useState } from 'react';
import { getProductsByCollection } from '../../lib/shopify';
import { CatalogPage } from './CatalogPage';

function formatCollectionTitle(handle: string) {
  return handle
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function CollectionLoadingState() {
  return (
    <section className="min-h-[70vh] bg-[radial-gradient(circle_at_6%_6%,rgba(15,90,70,0.17),transparent_28%),radial-gradient(circle_at_94%_8%,rgba(200,164,93,0.14),transparent_24%),linear-gradient(180deg,#C9D6CE_0%,#D7DDD6_42%,#E6E3DB_100%)] py-6 md:py-8">
      <div className="mx-auto w-full max-w-[1680px] px-4 md:px-6 lg:px-8">
        <div className="rounded-[1.5rem] border border-[#7EA08F]/35 bg-[linear-gradient(118deg,#16483B_0%,#0D2D25_58%,#292619_100%)] px-6 py-6 shadow-[0_16px_38px_rgba(8,39,31,0.16)] md:px-8">
          <div className="h-3 w-36 rounded-full bg-white/15" />
          <div className="mt-4 h-9 w-64 max-w-full rounded-xl bg-white/15" />
          <div className="mt-3 h-4 w-96 max-w-full rounded-full bg-white/10" />
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-[#B8C6BC] bg-[#CCD6CF] p-5">
          <div className="h-10 w-44 rounded-xl bg-[#B8C6BC]" />
          <div className="mt-5 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 rounded-2xl bg-[#F4F3EE]" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CollectionProducts({ handle }: { handle: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setLoading(true);

      try {
        const data = await getProductsByCollection(handle);

        if (isMounted) {
          setProducts(Array.isArray(data?.products) ? data.products : []);
        }
      } catch (error) {
        console.error('Unable to load collection products:', error);

        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [handle]);

  if (loading) return <CollectionLoadingState />;

  return (
    <CatalogPage
      customProducts={products}
      title={formatCollectionTitle(handle)}
      description="Browse and filter products available in this collection."
      headerVariant="collection"
    />
  );
}