import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import type {MouseEvent} from 'react';
import {ArrowLeft, ArrowRight, Tags} from 'lucide-react';
import {getCollectibleBrands, getProducts} from '../../lib/shopify';

const brandsPerPage = 16;

type BrandLogo = {
  url?: string;
  altText?: string | null;
};

type MetaobjectBrand = {
  name?: string;
  shopifyTag?: string;
  logo?: BrandLogo | null;
};

type BrandCardData = {
  tag: string;
  name: string;
  logo: BrandLogo | null;
  productCount: number;
};

function formatBrand(tag: string) {
  return tag
    .replace(/^brand_/i, '')
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

function getOptimizedLogoUrl(url: string) {
  try {
    const optimizedUrl = new URL(url);

    if (optimizedUrl.hostname.includes('cdn.shopify.com')) {
      optimizedUrl.searchParams.set('width', '520');
    }

    return optimizedUrl.toString();
  } catch {
    return url;
  }
}

const BrandCard = memo(function BrandCard({
  brand,
  priority,
  onNavigate,
}: {
  brand: BrandCardData;
  priority: boolean;
  onNavigate: (
    event: MouseEvent<HTMLAnchorElement>,
    brandTag: string
  ) => void;
}) {
  return (
    <a
      href={`/catalog?brand=${encodeURIComponent(brand.tag)}`}
      onClick={(event) => onNavigate(event, brand.tag)}
      className="group relative flex min-h-[310px] flex-col overflow-hidden rounded-[1.65rem] border border-[#B9C5BE] bg-[#F7F5F0] shadow-[0_10px_26px_rgba(24,48,40,0.08)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#0F5A46]/55 hover:shadow-[0_18px_34px_rgba(24,48,40,0.13)] [content-visibility:auto] [contain-intrinsic-size:310px]"
    >
      <div className="relative m-3 mb-0 flex h-[184px] items-center justify-center overflow-hidden rounded-[1.2rem] border border-[#D8D9D1] bg-[#FCFBF7] px-7">
        <div className="pointer-events-none absolute inset-x-10 bottom-3 h-10 rounded-full bg-[#0F5A46]/[0.07] blur-xl" />

        {brand.logo?.url ? (
          <img
            src={getOptimizedLogoUrl(brand.logo.url)}
            alt={brand.logo.altText || `${brand.name} logo`}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            className="relative h-full w-full object-contain py-8 transition-transform duration-300 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="relative flex h-[76px] min-w-[76px] items-center justify-center rounded-[1.15rem] bg-[#0F5A46] px-5 text-xl font-black tracking-[-0.02em] text-white shadow-[0_12px_24px_rgba(15,90,70,0.2)]">
            {getBrandInitials(brand.name)}
          </div>
        )}
      </div>

      <div className="flex flex-1 items-end justify-between gap-4 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <div className="min-w-0">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0F5A46]">
            Brand
          </p>

          <h3 className="truncate text-xl font-extrabold tracking-[-0.02em] text-[#17251F] transition-colors duration-300 group-hover:text-[#0F5A46]">
            {brand.name}
          </h3>

          <p className="mt-1.5 text-sm font-medium text-[#68756E]">
            {brand.productCount}{' '}
            {brand.productCount === 1 ? 'product' : 'products'}
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DCE7E1] text-[#0F5A46] transition-[background-color,color,transform] duration-300 group-hover:translate-x-0.5 group-hover:bg-[#0F5A46] group-hover:text-white">
          <ArrowRight className="h-5 w-5" />
        </span>
      </div>
    </a>
  );
});

export function BrandsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [metaobjectBrands, setMetaobjectBrands] = useState<MetaobjectBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isActive = true;

    async function loadBrands() {
      setIsLoading(true);
      setHasError(false);

      try {
        const [productData, brandData] = await Promise.all([
          getProducts(),
          getCollectibleBrands(),
        ]);

        if (!isActive) return;

        setProducts(Array.isArray(productData) ? productData : []);
        setMetaobjectBrands(Array.isArray(brandData) ? brandData : []);
      } catch (error) {
        console.error('Unable to load brands:', error);

        if (isActive) {
          setProducts([]);
          setMetaobjectBrands([]);
          setHasError(true);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadBrands();

    return () => {
      isActive = false;
    };
  }, []);

  const brands = useMemo<BrandCardData[]>(() => {
    const productCountByTag = new Map<string, number>();
    const originalTagByKey = new Map<string, string>();

    products.forEach((product) => {
      const uniqueProductBrandTags = new Set<string>();

      (product.tags || []).forEach((tag: unknown) => {
        if (typeof tag !== 'string' || !tag.toLowerCase().startsWith('brand_')) {
          return;
        }

        const key = tag.toLowerCase();
        uniqueProductBrandTags.add(key);
        originalTagByKey.set(key, tag);
      });

      uniqueProductBrandTags.forEach((key) => {
        productCountByTag.set(key, (productCountByTag.get(key) || 0) + 1);
      });
    });

    const metaobjectMap = new Map(
      metaobjectBrands
        .filter((brand) => brand.shopifyTag)
        .map((brand) => [String(brand.shopifyTag).toLowerCase(), brand])
    );

    return Array.from(productCountByTag.entries())
      .map(([key, productCount]) => {
        const tag = originalTagByKey.get(key) || key;
        const metaobject = metaobjectMap.get(key);

        return {
          tag,
          name: metaobject?.name || formatBrand(tag),
          logo: metaobject?.logo || null,
          productCount,
        };
      })
      .sort(
        (a, b) =>
          b.productCount - a.productCount || a.name.localeCompare(b.name)
      );
  }, [metaobjectBrands, products]);

  const totalPages = Math.max(1, Math.ceil(brands.length / brandsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleBrands = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * brandsPerPage;
    return brands.slice(startIndex, startIndex + brandsPerPage);
  }, [brands, safeCurrentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const goToBrand = useCallback(function goToBrand(
    event: MouseEvent<HTMLAnchorElement>,
    brandTag: string
  ) {
    event.preventDefault();

    window.history.pushState(
      {},
      '',
      `/catalog?brand=${encodeURIComponent(brandTag)}`
    );

    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({top: 0, behavior: 'auto'});
  }, []);

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));

    window.requestAnimationFrame(() => {
      document
        .getElementById('brand-directory')
        ?.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#CDD6CF] py-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(15,90,70,0.035)_1px,transparent_1px),linear-gradient(rgba(15,90,70,0.035)_1px,transparent_1px)] bg-[size:54px_54px]" />

      <div className="relative mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-10">
        <header className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(112deg,#123F34_0%,#102E27_58%,#29291E_100%)] px-6 py-8 shadow-[0_18px_42px_rgba(19,46,37,0.18)] sm:px-8 md:px-10 md:py-9">
          <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border border-[#C8A45D]/15" />
          <div className="pointer-events-none absolute right-8 top-6 h-28 w-44 rotate-[-5deg] rounded-[1.4rem] border border-white/[0.08] bg-white/[0.025]" />
          <div className="pointer-events-none absolute right-1 top-10 h-28 w-44 rotate-[6deg] rounded-[1.4rem] border border-[#C8A45D]/20 bg-[#C8A45D]/[0.025]" />

          <div className="relative max-w-3xl">
            <div className="mb-4 flex items-center gap-2 text-[#D5B85F]">
              <Tags className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-[0.14em]">
                Brands
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-white sm:text-4xl md:text-[2.7rem] md:leading-[1.05]">
              Find the brands you collect
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#C5D0CB] sm:text-base">
              Browse the names available in our catalog and see every product
              connected to each brand.
            </p>
          </div>
        </header>

        <section id="brand-directory" className="scroll-mt-24 pb-8 pt-7 md:pt-8">
          <div className="mb-5">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#0F5A46]">
              Browse Brands
            </p>
            <h2 className="text-2xl font-extrabold tracking-[-0.025em] text-[#17251F] sm:text-3xl">
              Shop by brand
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({length: 8}).map((_, index) => (
                <div
                  key={index}
                  className="h-[310px] animate-pulse rounded-[1.65rem] border border-[#B9C5BE] bg-[#E5E9E4]"
                />
              ))}
            </div>
          ) : hasError ? (
            <div className="rounded-[1.65rem] border border-[#B9C5BE] bg-[#F7F5F0] p-7 shadow-[0_10px_26px_rgba(24,48,40,0.08)] sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E2EAE5] text-[#0F5A46]">
                <Tags className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-[#17251F]">
                Brands could not be loaded
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#68756E]">
                Refresh the page to try again. If the issue continues, verify
                the Shopify connection and brand metaobjects.
              </p>
            </div>
          ) : brands.length === 0 ? (
            <div className="rounded-[1.65rem] border border-[#B9C5BE] bg-[#F7F5F0] p-7 shadow-[0_10px_26px_rgba(24,48,40,0.08)] sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E2EAE5] text-[#0F5A46]">
                <Tags className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-[#17251F]">
                No brands found yet
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#68756E]">
                Add Shopify tags such as <strong>brand_mini_gt</strong> or{' '}
                <strong>brand_maisto</strong> to display their cards here.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleBrands.map((brand, index) => (
                  <BrandCard
                    key={brand.tag}
                    brand={brand}
                    priority={safeCurrentPage === 1 && index < 4}
                    onNavigate={goToBrand}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  aria-label="Brand directory pages"
                  className="mt-7 flex flex-wrap items-center justify-center gap-2"
                >
                  <button
                    type="button"
                    disabled={safeCurrentPage === 1}
                    onClick={() => goToPage(safeCurrentPage - 1)}
                    className="flex h-10 items-center gap-2 rounded-full border border-[#AAB9B1] bg-[#F7F5F0] px-4 text-sm font-bold text-[#17251F] transition-colors hover:border-[#0F5A46] hover:text-[#0F5A46] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <span className="px-3 text-sm font-semibold text-[#52635A]">
                    Page {safeCurrentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => goToPage(safeCurrentPage + 1)}
                    className="flex h-10 items-center gap-2 rounded-full border border-[#AAB9B1] bg-[#F7F5F0] px-4 text-sm font-bold text-[#17251F] transition-colors hover:border-[#0F5A46] hover:text-[#0F5A46] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}