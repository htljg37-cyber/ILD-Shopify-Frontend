import {useEffect, useMemo, useState} from 'react';
import type {MouseEvent} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  ArrowRight,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {getProducts, getVehicleMakes} from '../../lib/shopify';

type Product = {
  tags?: string[] | null;
};

type MakeLogo = {
  url: string;
  altText?: string | null;
};

type MakeMetaobject = {
  shopifyTag?: string | null;
  name?: string | null;
  logo?: MakeLogo | null;
};

type VehicleMake = {
  tag: string;
  name: string;
  logo: MakeLogo | null;
  productCount: number;
};

function formatMake(tag: string) {
  return tag
    .replace('make_', '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getMakeInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function getItemsPerPage(width: number) {
  if (width >= 1280) return 6;
  if (width >= 1024) return 4;
  if (width >= 640) return 3;
  return 2;
}

function getInitialItemsPerPage() {
  if (typeof window === 'undefined') return 6;
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

export function VehicleMakes() {
  const [products, setProducts] = useState<Product[]>([]);
  const [metaobjectMakes, setMetaobjectMakes] = useState<MakeMetaobject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(
    getInitialItemsPerPage
  );

  useEffect(() => {
    let isMounted = true;

    async function loadMakes() {
      try {
        const [productData, makeData] = await Promise.all([
          getProducts(),
          getVehicleMakes(),
        ]);

        if (!isMounted) return;

        setProducts(Array.isArray(productData) ? productData : []);
        setMetaobjectMakes(Array.isArray(makeData) ? makeData : []);
      } catch (error) {
        console.error('Unable to load vehicle makes:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMakes();

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

  const makes = useMemo<VehicleMake[]>(() => {
    const makeCounts = new Map<string, {tag: string; count: number}>();

    products.forEach((product) => {
      const productMakeTags = new Set(
        (product.tags || []).filter(
          (tag): tag is string =>
            typeof tag === 'string' && tag.startsWith('make_')
        )
      );

      productMakeTags.forEach((tag) => {
        const normalizedTag = tag.toLowerCase();
        const current = makeCounts.get(normalizedTag);

        makeCounts.set(normalizedTag, {
          tag: current?.tag || tag,
          count: (current?.count || 0) + 1,
        });
      });
    });

    const metaobjectMap = new Map(
      metaobjectMakes.map((make) => [
        String(make.shopifyTag || '').toLowerCase(),
        make,
      ])
    );

    return Array.from(makeCounts.entries())
      .map(([normalizedTag, makeEntry]) => {
        const metaobject = metaobjectMap.get(normalizedTag);

        return {
          tag: makeEntry.tag,
          name: metaobject?.name || formatMake(makeEntry.tag),
          logo: metaobject?.logo || null,
          productCount: makeEntry.count,
        };
      })
      .sort(
        (a, b) =>
          b.productCount - a.productCount || a.name.localeCompare(b.name)
      );
  }, [metaobjectMakes, products]);

  const totalPages = Math.max(1, Math.ceil(makes.length / itemsPerPage));

  const visibleMakes = useMemo(
    () =>
      makes.slice(
        currentPage * itemsPerPage,
        currentPage * itemsPerPage + itemsPerPage
      ),
    [currentPage, itemsPerPage, makes]
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages - 1));
  }, [totalPages]);

  function changePage(direction: number) {
    setCurrentPage((page) => (page + direction + totalPages) % totalPages);
  }

  function navigateToCatalog(event: MouseEvent<HTMLAnchorElement>, path: string) {
    event.preventDefault();
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));

    // Lenis already controls wheel smoothing. Using native smooth scrolling
    // here would create a second animation and can make navigation feel delayed.
    window.scrollTo({top: 0, behavior: 'auto'});
  }

  return (
    <section className="performance-section relative overflow-hidden bg-[#F7F5F0] pb-6 pt-8 md:pb-8 md:pt-10">
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{opacity: 0, y: 12}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.2}}
          transition={{duration: 0.42, ease: [0.22, 1, 0.36, 1]}}
          className="mb-6 flex flex-col gap-6 md:mb-8 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white px-4 py-2 shadow-sm">
              <Sparkles className="h-4 w-4 text-[#C8A45D]" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#0F5A46]">
                Vehicle Makes
              </span>
            </div>

            <h2 className="mb-3 text-4xl font-extrabold tracking-[-0.02em] text-[#111111] md:text-5xl">
              Shop by Vehicle Make
            </h2>

            <p className="max-w-2xl text-base leading-relaxed text-[#717182] md:text-lg">
              Find models inspired by the vehicle manufacturers you collect
              and admire.
            </p>
          </div>

          <a
            href="/catalog?category=category_diecast"
            onClick={(event) =>
              navigateToCatalog(event, '/catalog?category=category_diecast')
            }
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white px-6 py-3.5 text-sm font-bold text-[#0F5A46] shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#0F5A46]/30 hover:shadow-md motion-reduce:transition-none"
          >
            Explore All Vehicles
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
          </a>
        </motion.div>

        {isLoading ? (
          <div className="grid animate-pulse grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({length: 6}).map((_, index) => (
              <div
                key={index}
                className="h-[220px] rounded-[1.75rem] border border-[#EAE7DF] bg-white/70"
              />
            ))}
          </div>
        ) : makes.length === 0 ? (
          <div className="rounded-3xl border border-[#EAE7DF] bg-white p-8 text-center shadow-sm">
            <CarFront className="mx-auto mb-3 h-7 w-7 text-[#0F5A46]" />
            <p className="text-sm font-semibold text-[#717182]">
              No vehicle makes were found. Add a make_ tag to a product to
              display it here.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-[2.25rem] border border-white/90 bg-white/60 p-3 shadow-[0_14px_38px_rgba(17,17,17,0.05)] sm:p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentPage}-${itemsPerPage}`}
                  initial={{opacity: 0, y: 8}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, y: -5}}
                  transition={{
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
                >
                  {visibleMakes.map((make) => (
                    <a
                      key={make.tag}
                      href={`/catalog?make=${encodeURIComponent(make.tag)}`}
                      onClick={(event) =>
                        navigateToCatalog(
                          event,
                          `/catalog?make=${encodeURIComponent(make.tag)}`
                        )
                      }
                      className="group relative flex min-h-[220px] flex-col overflow-hidden rounded-[1.75rem] border border-[#E3DED3] bg-white p-4 shadow-[0_8px_22px_rgba(17,17,17,0.05)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[#0F5A46]/25 hover:shadow-[0_14px_30px_rgba(15,90,70,0.12)] motion-reduce:transition-none"
                    >
                      <div className="relative flex h-32 items-center justify-center rounded-[1.25rem] border border-[#EBE6DC] bg-[#FAF9F6] px-5">
                        {make.logo?.url ? (
                          <img
                            src={getOptimizedLogoUrl(make.logo.url, 320)}
                            srcSet={`${getOptimizedLogoUrl(
                              make.logo.url,
                              220
                            )} 220w, ${getOptimizedLogoUrl(
                              make.logo.url,
                              320
                            )} 320w`}
                            sizes="(min-width: 1280px) 220px, (min-width: 640px) 260px, 42vw"
                            alt={make.logo.altText || `${make.name} logo`}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="h-full w-full object-contain py-5 transition-transform duration-200 group-hover:scale-[1.04] motion-reduce:transition-none"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-[1.15rem] bg-[#0F5A46] text-lg font-black text-white shadow-[0_10px_22px_rgba(15,90,70,0.20)] transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transition-none">
                            {getMakeInitials(make.name)}
                          </div>
                        )}
                      </div>

                      <div className="relative mt-4 flex flex-1 items-end justify-between gap-3">
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0F5A46]">
                            Vehicle Make
                          </p>
                          <h3 className="text-base font-extrabold text-[#111111] transition-colors duration-200 group-hover:text-[#0F5A46] sm:text-lg">
                            {make.name}
                          </h3>
                        </div>

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F5A46]/10 text-[#0F5A46] transition-[background-color,color] duration-200 group-hover:bg-[#0F5A46] group-hover:text-white motion-reduce:transition-none">
                          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
                        </span>
                      </div>
                    </a>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => changePage(-1)}
                  aria-label="Previous vehicle make page"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D8D3C8] bg-white text-[#0F5A46] shadow-sm transition-[transform,border-color,background-color,color] duration-200 hover:-translate-y-0.5 hover:border-[#0F5A46]/30 hover:bg-[#0F5A46] hover:text-white motion-reduce:transition-none"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex h-11 min-w-[104px] items-center justify-center rounded-full border border-[#D8D3C8] bg-white px-5 text-sm font-extrabold text-[#111111] shadow-sm">
                  <span>{String(currentPage + 1).padStart(2, '0')}</span>
                  <span className="mx-2 text-[#C8A45D]">/</span>
                  <span>{String(totalPages).padStart(2, '0')}</span>
                </div>

                <button
                  type="button"
                  onClick={() => changePage(1)}
                  aria-label="Next vehicle make page"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#0F5A46]/20 bg-[#0F5A46] text-white shadow-[0_8px_18px_rgba(15,90,70,0.18)] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#0B4939] motion-reduce:transition-none"
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