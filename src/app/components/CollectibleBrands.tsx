import {useEffect, useMemo, useState} from 'react';
import type {MouseEvent} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {getCollectibleBrands, getProducts} from '../../lib/shopify';

type Product = {
  tags?: string[] | null;
};

type BrandLogo = {
  url: string;
  altText?: string | null;
};

type BrandMetaobject = {
  shopifyTag?: string | null;
  name?: string | null;
  logo?: BrandLogo | null;
};

type CollectibleBrand = {
  tag: string;
  name: string;
  logo: BrandLogo | null;
  productCount: number;
};

function formatBrand(tag: string) {
  return tag
    .replace('brand_', '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getBrandInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function getItemsPerPage(width: number) {
  if (width >= 1280) return 5;
  if (width >= 1024) return 4;
  if (width >= 640) return 2;
  return 1;
}

function getInitialItemsPerPage() {
  if (typeof window === 'undefined') return 5;
  return getItemsPerPage(window.innerWidth);
}

function getOptimizedLogoUrl(url: string, width: number) {
  try {
    const optimizedUrl = new URL(url);
    optimizedUrl.searchParams.set('width', String(width));
    return optimizedUrl.toString();
  } catch {
    return url;
  }
}

export function CollectibleBrands() {
  const [products, setProducts] = useState<Product[]>([]);
  const [metaobjectBrands, setMetaobjectBrands] = useState<BrandMetaobject[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(
    getInitialItemsPerPage
  );

  useEffect(() => {
    let isMounted = true;

    async function loadBrands() {
      try {
        const [productData, brandData] = await Promise.all([
          getProducts(),
          getCollectibleBrands(),
        ]);

        if (!isMounted) return;

        setProducts(Array.isArray(productData) ? productData : []);
        setMetaobjectBrands(Array.isArray(brandData) ? brandData : []);
      } catch (error) {
        console.error('Unable to load collectible brands:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadBrands();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let animationFrame = 0;

    function updateItemsPerPage() {
      cancelAnimationFrame(animationFrame);

      animationFrame = requestAnimationFrame(() => {
        const nextValue = getItemsPerPage(window.innerWidth);
        setItemsPerPage((currentValue) =>
          currentValue === nextValue ? currentValue : nextValue
        );
      });
    }

    window.addEventListener('resize', updateItemsPerPage, {passive: true});

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', updateItemsPerPage);
    };
  }, []);

  const brands = useMemo<CollectibleBrand[]>(() => {
    const brandCounts = new Map<string, {tag: string; count: number}>();

    products.forEach((product) => {
      const productBrandTags = new Set(
        (product.tags || []).filter(
          (tag): tag is string =>
            typeof tag === 'string' && tag.startsWith('brand_')
        )
      );

      productBrandTags.forEach((tag) => {
        const normalizedTag = tag.toLowerCase();
        const current = brandCounts.get(normalizedTag);

        brandCounts.set(normalizedTag, {
          tag: current?.tag || tag,
          count: (current?.count || 0) + 1,
        });
      });
    });

    const metaobjectMap = new Map(
      metaobjectBrands.map((brand) => [
        String(brand.shopifyTag || '').toLowerCase(),
        brand,
      ])
    );

    return Array.from(brandCounts.entries())
      .map(([normalizedTag, brandEntry]) => {
        const metaobject = metaobjectMap.get(normalizedTag);

        return {
          tag: brandEntry.tag,
          name: metaobject?.name || formatBrand(brandEntry.tag),
          logo: metaobject?.logo || null,
          productCount: brandEntry.count,
        };
      })
      .sort(
        (a, b) =>
          b.productCount - a.productCount || a.name.localeCompare(b.name)
      );
  }, [metaobjectBrands, products]);

  const totalPages = Math.max(1, Math.ceil(brands.length / itemsPerPage));

  const visibleBrands = useMemo(
    () =>
      brands.slice(
        currentPage * itemsPerPage,
        currentPage * itemsPerPage + itemsPerPage
      ),
    [brands, currentPage, itemsPerPage]
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages - 1));
  }, [totalPages]);

  function changePage(direction: number) {
    setCurrentPage((page) => (page + direction + totalPages) % totalPages);
  }

  function navigateTo(event: MouseEvent<HTMLAnchorElement>, path: string) {
    event.preventDefault();
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));

    // Lenis handles wheel smoothing. Avoid a second native smooth animation.
    window.scrollTo({top: 0, behavior: 'auto'});
  }

  return (
    <section className="performance-section relative overflow-hidden bg-[#F7F5F0] pb-6 pt-8 md:pb-8 md:pt-10">
      <div className="relative z-10 mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{opacity: 0, y: 12}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.2}}
          transition={{
            duration: 0.42,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
          className="mb-9 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white px-4 py-2 shadow-sm">
              <Sparkles className="h-4 w-4 text-[#C8A45D]" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#0F5A46]">
                Collector Brands
              </span>
            </div>

            <h2 className="mb-3 text-4xl font-extrabold tracking-[-0.045em] text-[#111111] md:text-5xl lg:text-6xl">
              Shop by Collectible Brand
            </h2>

            <p className="max-w-2xl text-base leading-relaxed text-[#717182] md:text-lg">
              Explore products from the manufacturers and collectible brands
              available at ILD.
            </p>
          </div>

          <a
            href="/brands"
            onClick={(event) => navigateTo(event, '/brands')}
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white px-6 py-3.5 text-sm font-bold text-[#0F5A46] shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#0F5A46]/30 hover:shadow-md motion-reduce:transition-none"
          >
            View All Brands
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
          </a>
        </motion.div>

        {isLoading ? (
          <div className="grid animate-pulse grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({length: 5}).map((_, index) => (
              <div
                key={index}
                className="h-[310px] rounded-[2rem] border border-[#EAE7DF] bg-white/70"
              />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <div className="rounded-3xl border border-[#EAE7DF] bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-[#717182]">
              No collectible brands were found.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-[2.25rem] border border-white/90 bg-white/60 p-3 shadow-[0_16px_42px_rgba(17,17,17,0.05)] sm:p-5 lg:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentPage}-${itemsPerPage}`}
                  initial={{opacity: 0, y: 8}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, y: -5}}
                  transition={{
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1] as const,
                  }}
                  className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
                >
                  {visibleBrands.map((brand) => (
                    <a
                      key={brand.tag}
                      href={`/catalog?brand=${encodeURIComponent(brand.tag)}`}
                      onClick={(event) =>
                        navigateTo(
                          event,
                          `/catalog?brand=${encodeURIComponent(brand.tag)}`
                        )
                      }
                      className="group relative flex min-h-[310px] flex-col overflow-hidden rounded-[1.75rem] border border-[#E3DED3] bg-white p-5 shadow-[0_8px_24px_rgba(17,17,17,0.05)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[#0F5A46]/25 hover:shadow-[0_15px_34px_rgba(15,90,70,0.12)] motion-reduce:transition-none sm:p-6"
                    >
                      <div className="relative flex h-40 items-center justify-center rounded-[1.35rem] border border-[#EBE6DC] bg-[#FAF9F6] px-7 sm:h-44">
                        {brand.logo?.url ? (
                          <img
                            src={getOptimizedLogoUrl(brand.logo.url, 360)}
                            srcSet={`${getOptimizedLogoUrl(
                              brand.logo.url,
                              240
                            )} 240w, ${getOptimizedLogoUrl(
                              brand.logo.url,
                              360
                            )} 360w`}
                            sizes="(min-width: 1280px) 260px, (min-width: 640px) 340px, 84vw"
                            alt={brand.logo.altText || `${brand.name} logo`}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="h-full w-full object-contain py-5 transition-transform duration-200 group-hover:scale-[1.04] motion-reduce:transition-none"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-[1.35rem] bg-[#0F5A46] text-xl font-black tracking-tight text-white shadow-[0_11px_24px_rgba(15,90,70,0.20)] transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transition-none">
                            {getBrandInitials(brand.name)}
                          </div>
                        )}
                      </div>

                      <div className="relative mt-5 flex flex-1 items-end justify-between gap-4">
                        <div>
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0F5A46]">
                            Collectible Brand
                          </p>
                          <h3 className="text-xl font-extrabold tracking-tight text-[#111111] transition-colors duration-200 group-hover:text-[#0F5A46]">
                            {brand.name}
                          </h3>
                        </div>

                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0F5A46]/10 text-[#0F5A46] transition-[background-color,color] duration-200 group-hover:bg-[#0F5A46] group-hover:text-white motion-reduce:transition-none">
                          <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
                        </span>
                      </div>
                    </a>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => changePage(-1)}
                  aria-label="Previous brand page"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D8D3C8] bg-white text-[#0F5A46] shadow-sm transition-[transform,border-color,background-color,color] duration-200 hover:-translate-y-0.5 hover:border-[#0F5A46]/30 hover:bg-[#0F5A46] hover:text-white motion-reduce:transition-none"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex h-12 min-w-[112px] items-center justify-center rounded-full border border-[#D8D3C8] bg-white px-5 text-sm font-extrabold text-[#111111] shadow-sm">
                  <span>{String(currentPage + 1).padStart(2, '0')}</span>
                  <span className="mx-2 text-[#C8A45D]">/</span>
                  <span>{String(totalPages).padStart(2, '0')}</span>
                </div>

                <button
                  type="button"
                  onClick={() => changePage(1)}
                  aria-label="Next brand page"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[#0F5A46]/20 bg-[#0F5A46] text-white shadow-[0_8px_18px_rgba(15,90,70,0.18)] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#0B4939] motion-reduce:transition-none"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}