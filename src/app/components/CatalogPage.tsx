import { useEffect, useMemo, useState } from 'react';
import {
  ShoppingCart,
  SlidersHorizontal,
  X,
  Sparkles,
  ArrowRight,
  Star,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Button } from './ui/button';
import { getProducts, createCart, addToCart } from '../../lib/shopify';

const filterGroups = [
  { label: 'Category', prefix: 'category_' },
  { label: 'Brand', prefix: 'brand_' },
  { label: 'Scale', prefix: 'scale_' },
  { label: 'Vehicle Type', prefix: 'vehicle_' },
  { label: 'Size', prefix: 'size_' },
  { label: 'Color', prefix: 'color_' },
  { label: 'Condition', prefix: 'condition_' },
  { label: 'Stock', prefix: 'stock_' },
];

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-low' },
  { label: 'Price: High to Low', value: 'price-high' },
];

const productsPerPage = 12;

function formatTag(tag: string, prefix: string) {
  return tag
    .replace(prefix, '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatBrandName(tag: string) {
  return tag
    .replace('brand_', '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeText(text = '') {
  return text.toLowerCase().replaceAll('_', ' ').trim();
}

type CatalogPageProps = {
  customProducts?: any[];
  title?: string;
  description?: string;
};

type PremiumDropdownOption = {
  label: string;
  value: string;
};

type PremiumDropdownProps = {
  label?: string;
  value: string;
  options: PremiumDropdownOption[];
  placeholder?: string;
  onChange: (value: string) => void;
};

function PremiumDropdown({
  label,
  value,
  options,
  placeholder = 'All',
  onChange,
}: PremiumDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label || placeholder;

  return (
    <div className="relative">
      {label && (
        <label className="mb-2 block text-sm font-bold text-[#111111]">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        onBlur={() => window.setTimeout(() => setOpen(false), 140)}
        className={`group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold shadow-sm outline-none transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,90,70,0.10)] ${
          open
            ? 'border-[#0F5A46]/35 bg-white shadow-[0_12px_30px_rgba(15,90,70,0.10)] ring-2 ring-[#0F5A46]/8'
            : 'border-[#EAE7DF] bg-[#F8F7F3]'
        }`}
      >
        <span className={`truncate ${selectedOption ? 'text-[#111111]' : 'text-[#717182]'}`}>
          {displayLabel}
        </span>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#0F5A46] shadow-sm transition-all duration-300 group-hover:bg-[#0F5A46] group-hover:text-white">
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-72 overflow-y-auto rounded-2xl border border-[#EAE7DF] bg-white/95 p-2 shadow-[0_22px_55px_rgba(17,17,17,0.16)] backdrop-blur-xl">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 hover:bg-[#0F5A46]/8 hover:text-[#0F5A46] ${
              !value ? 'bg-[#0F5A46]/8 text-[#0F5A46]' : 'text-[#111111]'
            }`}
          >
            All
            {!value && <Check className="h-4 w-4 text-[#C8A45D]" />}
          </button>

          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 hover:bg-[#0F5A46]/8 hover:text-[#0F5A46] ${
                value === option.value ? 'bg-[#0F5A46]/8 text-[#0F5A46]' : 'text-[#111111]'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {value === option.value && <Check className="h-4 w-4 shrink-0 text-[#C8A45D]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CatalogPage({
  customProducts,
  title = 'All Products',
  description = 'Browse and filter our complete catalog.',
}: CatalogPageProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [sort, setSort] = useState('newest');
  const [addingId, setAddingId] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [urlParams, setUrlParams] = useState(() => new URLSearchParams(window.location.search));

  const searchQuery = urlParams.get('search') || '';
  const brandFilter = urlParams.get('brand') || '';

  useEffect(() => {
    function handleUrlChange() {
      setUrlParams(new URLSearchParams(window.location.search));
      setCurrentPage(1);
    }

    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  useEffect(() => {
    async function loadProducts() {
      if (customProducts) {
        setProducts(customProducts);
      } else {
        const data = await getProducts();
        setProducts(data);
      }

      setCurrentPage(1);
    }

    loadProducts();
  }, [customProducts]);

  const availableFilters = useMemo(() => {
    return filterGroups.map((group) => {
      const options = Array.from(
        new Set(
          products
            .flatMap((product) => (product.tags || []) as string[])
            .filter((tag) => tag.startsWith(group.prefix))
        )
      ) as string[];

      return { ...group, options };
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const tags = (product.tags || []) as string[];
      const productTitle = normalizeText(product.title || '');
      const tagText = normalizeText(tags.join(' '));
      const query = normalizeText(searchQuery);

      const matchesBrand = !brandFilter || tags.includes(brandFilter);

      const matchesSearch =
        !query ||
        productTitle.includes(query) ||
        tagText.includes(query) ||
        query.split(' ').some((word) => productTitle.includes(word) || tagText.includes(word));

      const matchesFilters = Object.values(selectedFilters).every((selectedTag) => {
        if (!selectedTag) return true;
        return tags.includes(selectedTag);
      });

      return matchesBrand && matchesSearch && matchesFilters;
    });
  }, [products, searchQuery, brandFilter, selectedFilters]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const priceA = Number(a.priceRange?.minVariantPrice?.amount || 0);
      const priceB = Number(b.priceRange?.minVariantPrice?.amount || 0);

      if (sort === 'price-low') return priceA - priceB;
      if (sort === 'price-high') return priceB - priceA;

      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      return dateB - dateA;
    });
  }, [filteredProducts, sort]);

  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  const startIndex = (safeCurrentPage - 1) * productsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + productsPerPage);

  function updateFilter(prefix: string, value: string) {
    setSelectedFilters((current) => ({
      ...current,
      [prefix]: value,
    }));
    setCurrentPage(1);
  }

  function updateSort(value: string) {
    setSort(value);
    setCurrentPage(1);
  }

  function clearFilters() {
    setSelectedFilters({});
    setSort('newest');
    setCurrentPage(1);
  }

  function clearSearch() {
    window.history.pushState({}, '', '/catalog');
    setUrlParams(new URLSearchParams(''));
    setSelectedFilters({});
    setCurrentPage(1);
  }

  function goToPage(page: number) {
    const nextPage = Math.min(Math.max(page, 1), totalPages || 1);
    setCurrentPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleQuickAdd(product: any) {
    const isOutOfStock = product?.isOutOfStock || !product?.availableForSale;
    const variantId = product?.selectedVariant?.id || product?.variants?.[0]?.id;

    if (isOutOfStock) {
      alert('This product is currently out of stock.');
      return;
    }

    if (!variantId) {
      alert('This product does not have an available variant.');
      return;
    }

    setAddingId(product.id);

    try {
      const cartId = localStorage.getItem('shopify_cart_id');

      if (!cartId) {
        const newCart = await createCart(variantId, 1);

        if (!newCart || newCart.error) {
          alert(newCart?.message || 'Unable to create cart.');
          setAddingId('');
          return;
        }

        localStorage.setItem('shopify_cart_id', newCart.id);
        localStorage.setItem('shopify_cart_quantity', String(newCart.totalQuantity || 1));
      } else {
        const updatedCart = await addToCart(cartId, variantId, 1);

        if (!updatedCart || updatedCart.error) {
          alert(updatedCart?.message || 'Unable to add to cart.');
          setAddingId('');
          return;
        }

        localStorage.setItem('shopify_cart_quantity', String(updatedCart.totalQuantity || 1));
      }

      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }

    setAddingId('');
  }

  const activeFiltersCount = Object.values(selectedFilters).filter(Boolean).length;
  const brandName = brandFilter ? formatBrandName(brandFilter) : '';
  const headingTitle = brandFilter
    ? `${brandName} Products`
    : searchQuery
      ? `Search results for "${searchQuery}"`
      : title;

  const headingDescription = brandFilter
    ? `Browse all available products from ${brandName}.`
    : searchQuery
      ? 'Browse products related to your search.'
      : description;

  const showingStart = sortedProducts.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + productsPerPage, sortedProducts.length);

  return (
    <section className="relative overflow-visible py-12 md:py-18 bg-[radial-gradient(circle_at_10%_10%,rgba(15,90,70,0.07),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(200,164,93,0.10),transparent_28%),linear-gradient(180deg,#FAFAFA_0%,#F6F4EF_100%)]">
      <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white/75 px-4 py-2 shadow-sm">
              <Sparkles className="h-4 w-4 text-[#C8A45D]" />
              <span className="text-sm font-semibold text-[#0F5A46]">
                Premium Catalog
              </span>
            </div>

            <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-[#111111] md:text-5xl">
              {headingTitle}
            </h2>

            <p className="max-w-2xl text-sm text-[#717182] md:text-base">
              {headingDescription}
            </p>

            {(searchQuery || brandFilter) && (
              <button
                type="button"
                onClick={clearSearch}
                className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#0F5A46] transition-all duration-300 hover:translate-x-1"
              >
                Clear and view all products
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#EAE7DF] bg-white/85 px-4 py-3 text-sm font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,90,70,0.12)] md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#0F5A46]" />
              Filters
              {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
            </button>

            <div className="w-52">
              <PremiumDropdown
                value={sort}
                options={sortOptions}
                placeholder="Newest"
                onChange={updateSort}
              />
            </div>
          </div>
        </div>

        <div className="relative z-40 mb-10 hidden rounded-[2rem] border border-[#EAE7DF] bg-white/82 p-6 shadow-[0_14px_38px_rgba(17,17,17,0.05)] backdrop-blur-sm md:block">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {availableFilters
              .filter((group) => group.options.length > 0)
              .map((group) => (
                <PremiumDropdown
                  key={group.prefix}
                  label={group.label}
                  value={selectedFilters[group.prefix] || ''}
                  options={group.options.map((tag) => ({
                    label: formatTag(tag, group.prefix),
                    value: tag,
                  }))}
                  placeholder="All"
                  onChange={(value) => updateFilter(group.prefix, value)}
                />
              ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-[#717182]">
              Showing {showingStart}-{showingEnd} of {sortedProducts.length} product(s)
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-bold text-[#0F5A46] transition-all duration-300 hover:translate-x-1"
            >
              Clear filters →
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="fixed inset-0 z-[9999] md:hidden">
            <div
              className="absolute inset-0 bg-black/75"
              onClick={() => setFiltersOpen(false)}
            />

            <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[2rem] border border-white/10 bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-[#111111]">Filters</h3>

                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5] transition-all duration-300 hover:bg-[#0F5A46] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {availableFilters
                  .filter((group) => group.options.length > 0)
                  .map((group) => (
                    <PremiumDropdown
                      key={group.prefix}
                      label={group.label}
                      value={selectedFilters[group.prefix] || ''}
                      options={group.options.map((tag) => ({
                        label: formatTag(tag, group.prefix),
                        value: tag,
                      }))}
                      placeholder="All"
                      onChange={(value) => updateFilter(group.prefix, value)}
                    />
                  ))}
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  className="h-12 flex-1 rounded-2xl border-[#0F5A46] text-[#0F5A46]"
                >
                  Clear
                </Button>

                <Button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="h-12 flex-1 rounded-2xl bg-[#0F5A46] text-white hover:bg-[#126B54]"
                >
                  Show {sortedProducts.length}
                </Button>
              </div>
            </div>
          </div>
        )}

        <p className="mb-5 text-sm text-[#717182] md:hidden">
          Showing {showingStart}-{showingEnd} of {sortedProducts.length} product(s)
        </p>

        {sortedProducts.length === 0 ? (
          <div className="rounded-[2rem] border border-[#EAE7DF] bg-white/85 p-10 text-center shadow-sm">
            <p className="mb-2 font-bold text-[#111111]">No products found.</p>
            <p className="text-sm text-[#717182]">
              Try another search term or clear your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {paginatedProducts.map((product) => {
                const isOutOfStock = product?.isOutOfStock || !product?.availableForSale;

                return (
                  <a
                    href={`/product/${product.handle}`}
                    key={product.id}
                    className={`group relative block overflow-hidden rounded-3xl border border-[#EAE7DF] bg-white/85 shadow-[0_10px_30px_rgba(17,17,17,0.04)] backdrop-blur-sm transition-all duration-300 ease-out ${
                      isOutOfStock
                        ? 'opacity-80'
                        : 'hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,90,70,0.14)]'
                    }`}
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_0%,rgba(200,164,93,0.18),transparent_35%)]" />

                    <div className="relative h-64 overflow-hidden bg-[#F8F7F3] md:h-72">
                      {product.featuredImage?.url ? (
                        <img
                          src={product.featuredImage.url}
                          alt={product.title}
                          className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${
                            isOutOfStock ? 'grayscale opacity-70' : ''
                          }`}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#717182]">
                          No image
                        </div>
                      )}

                      {isOutOfStock ? (
                        <div className="absolute top-4 left-4 right-4 rounded-full bg-[#111111] px-4 py-2 text-center text-xs font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
                          Out of Stock
                        </div>
                      ) : (
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-[#0F5A46] px-3 py-1.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(15,90,70,0.25)]">
                          <Star className="h-3.5 w-3.5 fill-[#C8A45D] text-[#C8A45D]" />
                          Featured
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                        <Button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleQuickAdd(product);
                          }}
                          disabled={addingId === product.id || isOutOfStock}
                          className={`w-full rounded-2xl text-white shadow-[0_12px_28px_rgba(15,90,70,0.30)] transition-all duration-300 hover:-translate-y-0.5 ${
                            isOutOfStock
                              ? 'cursor-not-allowed bg-[#717182] hover:bg-[#717182]'
                              : 'bg-[#0F5A46] hover:bg-[#126B54]'
                          }`}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {isOutOfStock
                            ? 'Out of Stock'
                            : addingId === product.id
                              ? 'Adding...'
                              : 'Quick Add'}
                        </Button>
                      </div>
                    </div>

                    <div className="relative p-5">
                      <div className="mb-3">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                            isOutOfStock
                              ? 'bg-[#111111]/10 text-[#111111]'
                              : 'bg-[#0F5A46]/10 text-[#0F5A46]'
                          }`}
                        >
                          {isOutOfStock ? 'Unavailable' : 'Available'}
                        </span>
                      </div>

                      <h3 className="mb-3 line-clamp-2 text-base font-bold tracking-tight text-[#111111] transition-colors duration-300 group-hover:text-[#0F5A46] md:text-lg">
                        {product.title}
                      </h3>

                      <div className="flex items-end justify-between gap-3">
                        <p className="text-2xl font-extrabold text-[#111111]">
                          ${product.priceRange?.minVariantPrice?.amount}
                        </p>

                        <span className="text-xs font-bold text-[#717182] transition-colors duration-300 group-hover:text-[#C8A45D]">
                          {isOutOfStock ? 'Unavailable' : 'View Details'}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => goToPage(safeCurrentPage - 1)}
                  className="rounded-2xl border border-[#EAE7DF] bg-white/85 px-4 py-3 text-sm font-bold text-[#111111] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0F5A46] hover:text-white hover:shadow-[0_12px_30px_rgba(15,90,70,0.16)] disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-[#111111]"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1;

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`h-11 w-11 rounded-2xl text-sm font-bold transition-all duration-300 ${
                        safeCurrentPage === page
                          ? 'bg-[#0F5A46] text-white shadow-[0_12px_30px_rgba(15,90,70,0.22)]'
                          : 'border border-[#EAE7DF] bg-white/85 text-[#111111] hover:-translate-y-0.5 hover:bg-[#0F5A46]/10 hover:text-[#0F5A46]'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => goToPage(safeCurrentPage + 1)}
                  className="rounded-2xl border border-[#EAE7DF] bg-white/85 px-4 py-3 text-sm font-bold text-[#111111] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0F5A46] hover:text-white hover:shadow-[0_12px_30px_rgba(15,90,70,0.16)] disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-[#111111]"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}