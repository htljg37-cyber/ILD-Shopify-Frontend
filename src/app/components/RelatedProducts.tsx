import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Star, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { getProducts } from '../../lib/shopify';
import { getShippingLabel } from '../../lib/shipping';

function getPrice(product: any) {
  const selectedVariant = product?.selectedVariant || product?.variants?.[0];

  return Number(
    selectedVariant?.price?.amount ||
      product?.priceRange?.minVariantPrice?.amount ||
      0
  );
}

function getTagScore(currentTags: string[], productTags: string[]) {
  return productTags.reduce((score, tag) => {
    return currentTags.includes(tag) ? score + 1 : score;
  }, 0);
}

export function RelatedProducts({ currentProduct }: { currentProduct: any }) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function loadProducts() {
      const data = await getProducts();
      setProducts(data);
    }

    loadProducts();
  }, []);

  const relatedProducts = useMemo(() => {
    if (!currentProduct || products.length === 0) return [];

    const currentTags = currentProduct.tags || [];

    return products
      .filter((product) => product.id !== currentProduct.id)
      .map((product) => {
        const productTags = product.tags || [];
        const score = getTagScore(currentTags, productTags);

        return {
          product,
          score,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((item) => item.product);
  }, [products, currentProduct]);

  if (relatedProducts.length === 0) return null;

  return (
    <section className="container relative z-10 mx-auto px-4 pb-16 md:px-6 md:pb-24">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white/70 px-4 py-2 shadow-sm">
            <Star className="h-4 w-4 fill-[#C8A45D] text-[#C8A45D]" />
            <span className="text-sm font-bold text-[#0F5A46]">
              Similar Picks
            </span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-[#111111] md:text-4xl">
            You May Also Like
          </h2>

          <p className="mt-2 max-w-xl text-sm text-[#717182]">
            Products selected automatically based on similar tags and categories.
          </p>
        </div>

        <a
          href="/catalog"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0F5A46] transition hover:text-[#C8A45D]"
        >
          View all products
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {relatedProducts.map((product, index) => {
          const price = getPrice(product);
          const shippingLabel = getShippingLabel(product);
          const isOutOfStock =
            product?.isOutOfStock || !product?.availableForSale;

          return (
            <motion.a
              key={product.id}
              href={`/product/${product.handle}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: index * 0.06, duration: 0.4 }}
              className="group overflow-hidden rounded-3xl border border-[#EAE7DF] bg-white/85 shadow-[0_10px_30px_rgba(17,17,17,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,90,70,0.14)]"
            >
              <div className="relative aspect-square overflow-hidden bg-[#F8F7F4]">
                {product.featuredImage?.url ? (
                  <img
                    src={product.featuredImage.url}
                    alt={product.featuredImage?.altText || product.title}
                    className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                      isOutOfStock ? 'grayscale opacity-70' : ''
                    }`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#717182]">
                    No image
                  </div>
                )}

                {isOutOfStock ? (
                  <div className="absolute left-4 right-4 top-4 rounded-full bg-[#111111] px-4 py-2 text-center text-xs font-extrabold uppercase tracking-[0.18em] text-white">
                    Out of Stock
                  </div>
                ) : (
                  <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-[#0F5A46] px-3 py-1.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(15,90,70,0.25)]">
                    <Star className="h-3.5 w-3.5 fill-[#C8A45D] text-[#C8A45D]" />
                    Related
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="mb-3 line-clamp-2 text-base font-extrabold tracking-tight text-[#111111] transition group-hover:text-[#0F5A46]">
                  {product.title}
                </h3>

                <p className="mb-3 text-2xl font-extrabold text-[#111111]">
                  ${price.toFixed(2)}
                </p>

                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F5A46]/8 px-3 py-1 text-xs font-bold text-[#0F5A46]">
                    <Truck className="h-3.5 w-3.5" />
                    {shippingLabel}
                  </span>

                  <span className="text-xs font-bold text-[#717182] transition group-hover:text-[#C8A45D]">
                    View Details
                  </span>
                </div>
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}