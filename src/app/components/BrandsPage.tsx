import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BadgeCheck, Sparkles, Tags } from 'lucide-react';
import { getProducts } from '../../lib/shopify';

function formatBrand(tag: string) {
  return tag
    .replace('brand_', '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function BrandsPage() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function loadProducts() {
      const data = await getProducts();
      setProducts(data);
    }

    loadProducts();
  }, []);

  const brands = useMemo(() => {
    const brandTags = products
      .flatMap((product) => product.tags || [])
      .filter((tag: string) => tag.startsWith('brand_'));

    return Array.from(new Set(brandTags));
  }, [products]);

  return (
    <section className="relative overflow-hidden py-12 md:py-20 bg-[radial-gradient(circle_at_10%_10%,rgba(15,90,70,0.07),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(200,164,93,0.10),transparent_28%),linear-gradient(180deg,#FAFAFA_0%,#F6F4EF_100%)]">
      <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white/75 px-4 py-2 shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-[#C8A45D]" />
            <span className="text-sm font-semibold text-[#0F5A46]">
              Brand Directory
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-3 text-3xl font-extrabold tracking-tight text-[#111111] md:text-5xl"
          >
            Shop by Brand
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl text-[#717182]"
          >
            Explore available brands from our curated catalog and quickly find
            products connected to each collection.
          </motion.p>
        </div>

        {brands.length === 0 ? (
          <div className="rounded-[2rem] border border-[#EAE7DF] bg-white/85 p-8 shadow-[0_18px_55px_rgba(17,17,17,0.06)] backdrop-blur-sm md:p-10">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F5A46]/10 text-[#0F5A46]">
              <Tags className="h-7 w-7" />
            </div>

            <h3 className="mb-2 text-2xl font-extrabold text-[#111111]">
              No brands found yet
            </h3>

            <p className="max-w-xl text-[#717182]">
              Add tags like <strong>brand_mini_gt</strong> or{' '}
              <strong>brand_maisto</strong> in Shopify to display brand cards
              here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {brands.map((brand, index) => {
              const brandName = formatBrand(brand);

              return (
                <motion.a
                  key={brand}
                  href={`/catalog?search=${encodeURIComponent(brandName)}`}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ delay: index * 0.06, duration: 0.45 }}
                  className="group relative overflow-hidden rounded-3xl border border-[#EAE7DF] bg-white/85 p-6 shadow-[0_10px_30px_rgba(17,17,17,0.04)] backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#0F5A46]/25 hover:shadow-[0_22px_55px_rgba(15,90,70,0.13)]"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_25%_0%,rgba(15,90,70,0.10),transparent_38%),radial-gradient(circle_at_80%_10%,rgba(200,164,93,0.16),transparent_38%)]" />

                  <div className="relative z-10 mb-7 flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F5A46] text-white shadow-[0_12px_26px_rgba(15,90,70,0.22)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:shadow-[0_16px_34px_rgba(15,90,70,0.30)]">
                      <BadgeCheck className="h-7 w-7" />
                    </div>

                    <span className="rounded-full border border-[#C8A45D]/25 bg-[#C8A45D]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A6A24]">
                      Brand
                    </span>
                  </div>

                  <div className="relative z-10">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0F5A46]">
                      Available Brand
                    </p>

                    <h3 className="mb-4 text-2xl font-extrabold tracking-tight text-[#111111] transition-colors duration-300 group-hover:text-[#0F5A46]">
                      {brandName}
                    </h3>

                    <div className="inline-flex items-center gap-2 text-sm font-bold text-[#0F5A46] transition-all duration-300 group-hover:gap-3">
                      View products
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0F5A46]/10 transition-all duration-300 group-hover:bg-[#0F5A46]">
                        <ArrowRight className="h-4 w-4 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white" />
                      </span>
                    </div>
                  </div>

                  <div className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-[#C8A45D]/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </motion.a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}