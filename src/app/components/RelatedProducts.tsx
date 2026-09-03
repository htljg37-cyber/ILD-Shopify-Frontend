import {memo, useEffect, useMemo, useRef, useState} from 'react';
import {ArrowRight, Star, Truck} from 'lucide-react';
import {motion} from 'motion/react';
import {getProducts} from '../../lib/shopify';
import {getShippingLabel} from '../../lib/shipping';

let catalogProductsPromise: Promise<any[]> | null = null;
let catalogProductsLoadedAt = 0;
const CATALOG_CACHE_MS = 5 * 60 * 1000;

function loadCatalogProducts() {
  const cacheExpired =
    catalogProductsLoadedAt > 0 &&
    Date.now() - catalogProductsLoadedAt > CATALOG_CACHE_MS;

  if (!catalogProductsPromise || cacheExpired) {
    catalogProductsPromise = getProducts()
      .then((data) => {
        catalogProductsLoadedAt = Date.now();
        return Array.isArray(data) ? data : [];
      })
      .catch((error) => {
        catalogProductsPromise = null;
        catalogProductsLoadedAt = 0;
        throw error;
      });
  }

  return catalogProductsPromise;
}

function getOptimizedProductImage(url = '', width = 560) {
  if (!url) return '';

  try {
    const imageUrl = new URL(url);
    if (imageUrl.hostname.includes('cdn.shopify.com')) {
      imageUrl.searchParams.set('width', String(width));
    }
    return imageUrl.toString();
  } catch {
    return url;
  }
}

function getPrice(product: any) {
  const selectedVariant = product?.selectedVariant || product?.variants?.[0];

  return Number(
    selectedVariant?.price?.amount ||
      product?.priceRange?.minVariantPrice?.amount ||
      0
  );
}

function getTagScore(currentTags: Set<string>, productTags: string[]) {
  let score = 0;

  for (const tag of productTags) {
    if (currentTags.has(tag)) score += 1;
  }

  return score;
}

const RelatedProductCard = memo(function RelatedProductCard({
  product,
}: {
  product: any;
}) {
  const price = getPrice(product);
  const shippingLabel = getShippingLabel(product);

  return (
    <a
      href={`/product/${product.handle}`}
      className="group overflow-hidden rounded-3xl border border-[#D8DDD8] bg-white shadow-[0_8px_20px_rgba(17,17,17,0.05)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#0F5A46]/25 hover:shadow-[0_16px_32px_rgba(15,90,70,0.11)] [content-visibility:auto] [contain-intrinsic-size:440px]"
    >
      <div className="aspect-square overflow-hidden bg-[#F8F7F4]">
        {product.featuredImage?.url ? (
          <img
            src={getOptimizedProductImage(product.featuredImage.url, 560)}
            alt={product.featuredImage.altText || product.title}
            loading="lazy"
            decoding="async"
            width="560"
            height="560"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#717182]">
            No image
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="mb-3 line-clamp-2 text-base font-extrabold tracking-tight text-[#111111] transition-colors group-hover:text-[#0F5A46]">
          {product.title}
        </h3>

        <p className="mb-3 text-2xl font-extrabold text-[#111111]">
          ${price.toFixed(2)}
        </p>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F0EB] px-3 py-1 text-xs font-bold text-[#0F5A46]">
          <Truck className="h-3.5 w-3.5" />
          {shippingLabel}
        </span>
      </div>
    </a>
  );
});

export function RelatedProducts({currentProduct}: {currentProduct: any}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {rootMargin: '600px 0px', threshold: 0}
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    let active = true;

    async function loadProducts() {
      try {
        const data = await loadCatalogProducts();
        if (active) setProducts(data);
      } catch {
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      active = false;
    };
  }, [shouldLoad]);

  const relatedProducts = useMemo(() => {
    if (!currentProduct || products.length === 0) return [];

    const currentTags = new Set<string>(currentProduct.tags || []);
    const candidates: Array<{product: any; score: number}> = [];

    for (const product of products) {
      const isCurrentProduct = product.id === currentProduct.id;
      const isOutOfStock = product?.isOutOfStock || !product?.availableForSale;

      if (isCurrentProduct || isOutOfStock) continue;

      candidates.push({
        product,
        score: getTagScore(currentTags, product.tags || []),
      });
    }

    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((item) => item.product);
  }, [products, currentProduct]);

  return (
    <section
      ref={sectionRef}
      className="container relative z-10 mx-auto border-t border-[#D8DDD8] px-4 py-16 md:px-6 md:py-24 [content-visibility:auto] [contain-intrinsic-size:650px]"
    >
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white px-4 py-2 shadow-sm">
            <Star className="h-4 w-4 fill-[#C8A45D] text-[#C8A45D]" />
            <span className="text-sm font-bold text-[#0F5A46]">
              Similar Picks
            </span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-[#111111] md:text-4xl">
            You May Also Like
          </h2>

          <p className="mt-2 max-w-xl text-sm text-[#717182]">
            Related products selected automatically from the current catalog.
          </p>
        </div>

        <a
          href="/catalog"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0F5A46] transition-colors hover:text-[#A98532]"
        >
          View all products
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      {!shouldLoad || loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({length: 4}).map((_, index) => (
            <div
              key={index}
              className="h-[430px] rounded-3xl border border-[#D8DDD8] bg-[#E6E8E4]"
            />
          ))}
        </div>
      ) : relatedProducts.length === 0 ? (
        <div className="rounded-3xl border border-[#D8DDD8] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#717182]">
            More products will appear here as your catalog grows.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{opacity: 0, y: 18}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, margin: '-80px'}}
          transition={{duration: 0.4}}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {relatedProducts.map((product) => (
            <RelatedProductCard key={product.id} product={product} />
          ))}
        </motion.div>
      )}
    </section>
  );
}