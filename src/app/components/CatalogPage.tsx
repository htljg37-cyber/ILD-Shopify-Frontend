import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingCart,
  SlidersHorizontal,
  X,
  ArrowRight,
  Star,
  ChevronDown,
  Check,
  Truck,
} from 'lucide-react';
import { Button } from './ui/button';
import { getProducts, createCart, addToCart } from '../../lib/shopify';
import { getShippingLabel } from '../../lib/shipping';

const filterGroups = [
  { label: 'Category', prefix: 'category_' },
  { label: 'Brand', prefix: 'brand_' },
  { label: 'Vehicle Make', prefix: 'make_' },
  { label: 'Vehicle Type', prefix: 'vehicle_' },
  { label: 'Scale', prefix: 'scale_' },
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

const productsPerPage = 20;

function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function getPriceInfo(product: any) {
  const selectedVariant = product?.selectedVariant || product?.variants?.[0];

  const priceAmount =
    selectedVariant?.price?.amount ||
    product?.priceRange?.minVariantPrice?.amount ||
    '0';

  const compareAtPriceAmount =
    selectedVariant?.compareAtPrice?.amount ||
    product?.compareAtPriceRange?.minVariantPrice?.amount ||
    null;

  const price = Number(priceAmount);
  const compareAtPrice = compareAtPriceAmount ? Number(compareAtPriceAmount) : 0;

  const hasCompareAtPrice =
    compareAtPriceAmount !== null &&
    !Number.isNaN(compareAtPrice) &&
    compareAtPrice > price;

  const discountPercent = hasCompareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return {
    price,
    compareAtPrice,
    hasCompareAtPrice,
    discountPercent,
  };
}

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

function formatVehicleMakeName(tag: string) {
  return tag
    .replace('make_', '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeText(text = '') {
  return text.toLowerCase().replaceAll('_', ' ').trim();
}

function productHasTag(product: any, tagFilter: string) {
  if (!tagFilter) return true;

  return ((product.tags || []) as string[]).some(
    (tag) => tag.toLowerCase() === tagFilter.toLowerCase()
  );
}

function productMatchesSearchBrandAndMake(
  product: any,
  searchQuery: string,
  brandFilter: string,
  vehicleMakeFilter: string
) {
  const tags = (product.tags || []) as string[];
  const normalizedTags = tags.map((tag) => tag.toLowerCase());
  const productTitle = normalizeText(product.title || '');
  const tagText = normalizeText(tags.join(' '));
  const query = normalizeText(searchQuery);

  const matchesBrand =
    !brandFilter || normalizedTags.includes(brandFilter.toLowerCase());

  const matchesVehicleMake =
    !vehicleMakeFilter ||
    normalizedTags.includes(vehicleMakeFilter.toLowerCase());

  const matchesSearch =
    !query ||
    productTitle.includes(query) ||
    tagText.includes(query) ||
    query
      .split(' ')
      .some((word) => productTitle.includes(word) || tagText.includes(word));

  return matchesBrand && matchesVehicleMake && matchesSearch;
}

function isProductOutOfStock(product: any) {
  return Boolean(
    product?.isOutOfStock || !product?.availableForSale
  );
}

function productMatchesSelectedFilter(
  product: any,
  prefix: string,
  selectedValue: string
) {
  if (!selectedValue) return true;

  if (prefix === 'stock_') {
    const isOutOfStock = isProductOutOfStock(product);

    if (selectedValue === 'stock_ready') {
      return !isOutOfStock;
    }

    if (selectedValue === 'stock_out_of_stock') {
      return isOutOfStock;
    }

    return true;
  }

  const tags = (product.tags || []) as string[];
  return tags.includes(selectedValue);
}

type CatalogPageProps = {
  customProducts?: any[];
  title?: string;
  description?: string;
  headerVariant?: 'catalog' | 'collection';
};

type CatalogDropdownOption = {
  label: string;
  value: string;
};

type CatalogDropdownProps = {
  label?: string;
  value: string;
  options: CatalogDropdownOption[];
  placeholder?: string;
  onChange: (value: string) => void;
};

function CatalogDropdown({
  label,
  value,
  options,
  placeholder = 'All',
  onChange,
}: CatalogDropdownProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const scrollTargetRef = useRef(0);
  const scrollFrameRef = useRef<number | null>(null);
  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label || placeholder;

  useEffect(() => {
    const menu = menuRef.current;

    if (!open || !menu) return;

    const activeMenu = menu;
    scrollTargetRef.current = activeMenu.scrollTop;

    function animateMenuScroll() {
      const distance = scrollTargetRef.current - activeMenu.scrollTop;

      if (Math.abs(distance) < 0.5) {
        activeMenu.scrollTop = scrollTargetRef.current;
        scrollFrameRef.current = null;
        return;
      }

      activeMenu.scrollTop += distance * 0.24;
      scrollFrameRef.current = window.requestAnimationFrame(animateMenuScroll);
    }

    function keepWheelInsideMenu(event: WheelEvent) {
      if (activeMenu.scrollHeight <= activeMenu.clientHeight) return;

      event.preventDefault();
      event.stopPropagation();

      if (scrollFrameRef.current === null) {
        scrollTargetRef.current = activeMenu.scrollTop;
      }

      const normalizedDelta =
        event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      const softenedDelta = Math.max(
        -48,
        Math.min(48, normalizedDelta * 0.45)
      );
      const maxScroll = activeMenu.scrollHeight - activeMenu.clientHeight;

      scrollTargetRef.current = Math.max(
        0,
        Math.min(maxScroll, scrollTargetRef.current + softenedDelta)
      );

      if (scrollFrameRef.current === null) {
        scrollFrameRef.current = window.requestAnimationFrame(animateMenuScroll);
      }
    }

    activeMenu.addEventListener('wheel', keepWheelInsideMenu, {
      passive: false,
    });

    return () => {
      activeMenu.removeEventListener('wheel', keepWheelInsideMenu);

      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [open]);

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
        className={`group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold shadow-sm outline-none transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md motion-reduce:transition-none ${
          open
            ? 'border-[#0F5A46]/35 bg-white shadow-md ring-2 ring-[#0F5A46]/8'
            : 'border-[#EAE7DF] bg-[#F8F7F3]'
        }`}
      >
        <span
          className={`truncate ${
            selectedOption ? 'text-[#111111]' : 'text-[#717182]'
          }`}
        >
          {displayLabel}
        </span>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#0F5A46] shadow-sm transition-[background-color,color] duration-200 group-hover:bg-[#0F5A46] group-hover:text-white">
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      {open && (
        <div
          ref={menuRef}
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[10050] max-h-72 touch-pan-y overflow-y-auto overscroll-contain rounded-2xl border border-[#EAE7DF] bg-white p-2 shadow-[0_16px_36px_rgba(17,17,17,0.14)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors duration-150 hover:bg-[#0F5A46]/8 hover:text-[#0F5A46] ${
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
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors duration-150 hover:bg-[#0F5A46]/8 hover:text-[#0F5A46] ${
                value === option.value
                  ? 'bg-[#0F5A46]/8 text-[#0F5A46]'
                  : 'text-[#111111]'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {value === option.value && (
                <Check className="h-4 w-4 shrink-0 text-[#C8A45D]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getOptimizedProductImageUrl(url: string, width: number) {
  try {
    const optimizedUrl = new URL(url);
    optimizedUrl.searchParams.set('width', String(width));
    return optimizedUrl.toString();
  } catch {
    return url;
  }
}

const productCardRenderStyle: CSSProperties = {
  contentVisibility: 'auto',
  containIntrinsicSize: '520px',
};

type ProductCardProps = {
  product: any;
  isAdding: boolean;
  priority: boolean;
  onQuickAdd: (product: any) => void | Promise<void>;
};

const ProductCard = memo(function ProductCard({
  product,
  isAdding,
  priority,
  onQuickAdd,
}: ProductCardProps) {
  const isOutOfStock = !product?.availableForSale;
  const {price, compareAtPrice, hasCompareAtPrice, discountPercent} =
    getPriceInfo(product);
  const shippingLabel = getShippingLabel(product);
  const imageUrl = product.featuredImage?.url || '';

  return (
    <a
      href={`/product/${product.handle}`}
      style={productCardRenderStyle}
      className="group relative block overflow-hidden rounded-3xl border border-[#E5E0D6] bg-white shadow-[0_8px_24px_rgba(17,17,17,0.045)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[#0F5A46]/25 hover:shadow-[0_16px_36px_rgba(15,90,70,0.12)] motion-reduce:transition-none"
    >
      <div className="relative h-64 overflow-hidden bg-[#F8F7F3] md:h-72">
        {imageUrl ? (
          <img
            src={getOptimizedProductImageUrl(imageUrl, 720)}
            srcSet={`${getOptimizedProductImageUrl(
              imageUrl,
              480
            )} 480w, ${getOptimizedProductImageUrl(
              imageUrl,
              720
            )} 720w`}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            alt={product.featuredImage?.altText || product.title}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            className={`h-full w-full object-cover transition-[transform,opacity] duration-300 ease-out group-hover:scale-[1.025] motion-reduce:transition-none ${
              isOutOfStock ? 'opacity-60' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#717182]">
            No image
          </div>
        )}

        {isOutOfStock ? (
          <div className="absolute left-4 right-4 top-4 rounded-full bg-[#111111] px-4 py-2 text-center text-xs font-extrabold uppercase tracking-[0.18em] text-white shadow-sm">
            Out of Stock
          </div>
        ) : (
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-[#0F5A46] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
            <Star className="h-3.5 w-3.5 fill-[#C8A45D] text-[#C8A45D]" />
            Featured
          </div>
        )}

        {hasCompareAtPrice && !isOutOfStock && (
          <div className="absolute right-4 top-4 rounded-full bg-[#C8A45D] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-sm">
            Save {discountPercent}%
          </div>
        )}

        <div className="absolute inset-x-4 bottom-4 translate-y-0 opacity-100 transition-[transform,opacity] duration-200 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 motion-reduce:transition-none">
          <Button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void onQuickAdd(product);
            }}
            disabled={isAdding || isOutOfStock}
            className={`w-full rounded-2xl text-white shadow-[0_8px_18px_rgba(15,90,70,0.22)] transition-colors duration-200 ${
              isOutOfStock
                ? 'cursor-not-allowed bg-[#717182] hover:bg-[#717182]'
                : 'bg-[#0F5A46] hover:bg-[#126B54]'
            }`}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isOutOfStock
              ? 'Out of Stock'
              : isAdding
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

        <h3 className="mb-3 line-clamp-2 text-base font-bold tracking-tight text-[#111111] transition-colors duration-200 group-hover:text-[#0F5A46] md:text-lg">
          {product.title}
        </h3>

        <div className="mb-3 flex flex-wrap items-end gap-2">
          <p className="text-2xl font-extrabold text-[#111111]">
            {formatMoney(price)}
          </p>

          {hasCompareAtPrice && (
            <p className="text-sm font-bold text-[#9CA3AF] line-through">
              {formatMoney(compareAtPrice)}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F5A46]/8 px-3 py-1 text-xs font-bold text-[#0F5A46]">
            <Truck className="h-3.5 w-3.5" />
            {shippingLabel}
          </span>

          <span className="text-xs font-bold text-[#717182] transition-colors duration-200 group-hover:text-[#C8A45D]">
            {isOutOfStock ? 'Unavailable' : 'View Details'}
          </span>
        </div>
      </div>
    </a>
  );
});

export function CatalogPage({
  customProducts,
  title = 'All Products',
  description = 'Browse and filter our complete catalog.',
  headerVariant = 'catalog',
}: CatalogPageProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!customProducts);
  const [sort, setSort] = useState('newest');
  const [addingId, setAddingId] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>(
    (): Record<string, string> => {
      const initialParams = new URLSearchParams(window.location.search);
      const categoryFilter = initialParams.get('category');
      const brandFilter = initialParams.get('brand');
      const vehicleMakeFilter = initialParams.get('make');

      const initialFilters: Record<string, string> = {};

      if (categoryFilter) {
        initialFilters.category_ = categoryFilter;
      }

      if (brandFilter) {
        initialFilters.brand_ = brandFilter;
      }

      if (vehicleMakeFilter) {
        initialFilters.make_ = vehicleMakeFilter;
      }

      return initialFilters;
    }
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [urlParams, setUrlParams] = useState(
    () => new URLSearchParams(window.location.search)
  );

  const searchQuery = urlParams.get('search') || '';
  const brandFilter = urlParams.get('brand') || '';
  const vehicleMakeFilter = urlParams.get('make') || '';
  const categoryFilter = urlParams.get('category') || '';

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [filtersOpen]);

  useEffect(() => {
    function handleUrlChange() {
      const nextParams = new URLSearchParams(window.location.search);

      setUrlParams(nextParams);
      setSelectedFilters((current) => ({
        ...current,
        category_: nextParams.get('category') || '',
        brand_: nextParams.get('brand') || '',
        make_: nextParams.get('make') || '',
      }));
      setCurrentPage(1);
    }

    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);

      try {
        const data = customProducts || (await getProducts());

        if (!isMounted) return;

        setProducts(Array.isArray(data) ? data : []);
        setCurrentPage(1);
      } catch (error) {
        console.error('Unable to load catalog products:', error);

        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [customProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearchBrandAndMake = productMatchesSearchBrandAndMake(
        product,
        searchQuery,
        brandFilter,
        vehicleMakeFilter
      );

      const matchesUrlCategory = productHasTag(product, categoryFilter);

      const matchesFilters = Object.entries(selectedFilters).every(
        ([prefix, selectedValue]) =>
          productMatchesSelectedFilter(
            product,
            prefix,
            selectedValue
          )
      );

      return matchesSearchBrandAndMake && matchesUrlCategory && matchesFilters;
    });
  }, [
    products,
    searchQuery,
    brandFilter,
    vehicleMakeFilter,
    categoryFilter,
    selectedFilters,
  ]);

  const availableFilters = useMemo(() => {
    return filterGroups.map((group) => {
      const productsForThisGroup = products.filter((product) => {
        const brandForThisGroup =
          group.prefix === 'brand_' ? '' : brandFilter;
        const makeForThisGroup =
          group.prefix === 'make_' ? '' : vehicleMakeFilter;

        const matchesSearchBrandAndMake = productMatchesSearchBrandAndMake(
          product,
          searchQuery,
          brandForThisGroup,
          makeForThisGroup
        );

        const matchesUrlCategory =
          group.prefix === 'category_' ||
          productHasTag(product, categoryFilter);
      
        const matchesOtherFilters = Object.entries(
          selectedFilters
        ).every(([prefix, selectedValue]) => {
          if (!selectedValue) return true;
        
          if (prefix === group.prefix) {
            return true;
          }
        
          return productMatchesSelectedFilter(
            product,
            prefix,
            selectedValue
          );
        });
      
        return (
          matchesSearchBrandAndMake &&
          matchesUrlCategory &&
          matchesOtherFilters
        );
      });
    
      let options: string[] = [];
    
      if (group.prefix === 'stock_') {
        const hasAvailableProducts = productsForThisGroup.some(
          (product) => !isProductOutOfStock(product)
        );
      
        const hasOutOfStockProducts = productsForThisGroup.some(
          (product) => isProductOutOfStock(product)
        );
      
        if (hasAvailableProducts) {
          options.push('stock_ready');
        }
      
        if (hasOutOfStockProducts) {
          options.push('stock_out_of_stock');
        }
      } else {
        options = Array.from(
          new Set(
            productsForThisGroup
              .flatMap(
                (product) =>
                  (product.tags || []) as string[]
              )
              .filter((tag) => tag.startsWith(group.prefix))
          )
        ) as string[];
      }
    
      return {...group, options};
    });
  }, [
    products,
    searchQuery,
    brandFilter,
    vehicleMakeFilter,
    categoryFilter,
    selectedFilters,
  ]);

  useEffect(() => {
    if (products.length === 0) return;

    setSelectedFilters((current) => {
      let changed = false;
      const nextFilters = { ...current };

      availableFilters.forEach((group) => {
        const currentValue = nextFilters[group.prefix];

        if (currentValue && !group.options.includes(currentValue)) {
          nextFilters[group.prefix] = '';
          changed = true;
        }
      });

      return changed ? nextFilters : current;
    });
  }, [availableFilters, products.length]);

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
  const paginatedProducts = sortedProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  function updateFilter(prefix: string, value: string) {
    setSelectedFilters((current) => ({
      ...current,
      [prefix]: value,
    }));

    if (
      prefix === 'category_' ||
      prefix === 'brand_' ||
      prefix === 'make_'
    ) {
      const nextParams = new URLSearchParams(window.location.search);
      const parameterName =
        prefix === 'category_'
          ? 'category'
          : prefix === 'brand_'
            ? 'brand'
            : 'make';

      if (value) {
        nextParams.set(parameterName, value);
      } else {
        nextParams.delete(parameterName);
      }

      const nextQuery = nextParams.toString();
      const nextUrl = nextQuery ? `/catalog?${nextQuery}` : '/catalog';

      window.history.pushState({}, '', nextUrl);
      setUrlParams(nextParams);
    }

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

    const nextParams = new URLSearchParams(window.location.search);
    nextParams.delete('make');
    nextParams.delete('brand');
    nextParams.delete('category');

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `/catalog?${nextQuery}` : '/catalog';

    window.history.pushState({}, '', nextUrl);
    setUrlParams(nextParams);
  }

  function clearSearch() {
    window.history.pushState({}, '', '/catalog');
    setUrlParams(new URLSearchParams(''));
    setSelectedFilters({});
    setCurrentPage(1);
  }

  function closeFilters() {
    setFiltersOpen(false);
  }

  function goToPage(page: number) {
    const nextPage = Math.min(Math.max(page, 1), totalPages || 1);
    setCurrentPage(nextPage);

    requestAnimationFrame(() => {
      document.getElementById('catalog-results')?.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      });
    });
  }

  const handleQuickAdd = useCallback(async (product: any) => {
    const isOutOfStock = !product?.availableForSale;
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
        localStorage.setItem(
          'shopify_cart_quantity',
          String(newCart.totalQuantity || 1)
        );
      } else {
        const updatedCart = await addToCart(cartId, variantId, 1);

        if (!updatedCart || updatedCart.error) {
          alert(updatedCart?.message || 'Unable to add to cart.');
          setAddingId('');
          return;
        }

        localStorage.setItem(
          'shopify_cart_quantity',
          String(updatedCart.totalQuantity || 1)
        );
      }

      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }

    setAddingId('');
  }, []);

  const activeFiltersCount = Object.values(selectedFilters).filter(Boolean).length;
  const brandName = brandFilter ? formatBrandName(brandFilter) : '';
  const vehicleMakeName = vehicleMakeFilter
    ? formatVehicleMakeName(vehicleMakeFilter)
    : '';
  const isCollectionHeader = headerVariant === 'collection';

  const headingTitle = vehicleMakeFilter
    ? `${vehicleMakeName} Vehicles`
    : brandFilter
      ? `${brandName} Products`
      : searchQuery
        ? `Search results for "${searchQuery}"`
        : title;

  const headingDescription = vehicleMakeFilter
    ? `Browse all available products featuring ${vehicleMakeName} vehicles.`
    : brandFilter
      ? `Browse all available products from ${brandName}.`
      : searchQuery
        ? 'Browse products related to your search.'
        : description;

  const showingStart = sortedProducts.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(
    startIndex + productsPerPage,
    sortedProducts.length
  );

  function getCurrentFilterValue(prefix: string) {
    if (selectedFilters[prefix]) return selectedFilters[prefix];
    if (prefix === 'category_') return categoryFilter;
    if (prefix === 'brand_') return brandFilter;
    if (prefix === 'make_') return vehicleMakeFilter;
    return '';
  }

  return (
    <>
      <section className="performance-section relative overflow-visible py-6 md:py-8 bg-[radial-gradient(circle_at_6%_6%,rgba(15,90,70,0.17),transparent_28%),radial-gradient(circle_at_94%_8%,rgba(200,164,93,0.14),transparent_24%),linear-gradient(180deg,#C9D6CE_0%,#D7DDD6_42%,#E6E3DB_100%)]">
        <div className="absolute inset-0 opacity-[0.045] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:46px_46px]" />

        <div className="relative z-10 mx-auto w-full max-w-[1680px] px-4 md:px-6 lg:px-8">
          <div
            className={`relative z-50 mb-5 overflow-visible rounded-[1.5rem] border shadow-[0_16px_38px_rgba(8,39,31,0.16)] ${
              isCollectionHeader
                ? 'border-[#7EA08F]/35 bg-[linear-gradient(118deg,#16483B_0%,#0D2D25_58%,#292619_100%)]'
                : 'border-[#C8A45D]/25 bg-[linear-gradient(115deg,#08271F_0%,#0B1713_58%,#292216_100%)]'
            }`}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] opacity-[0.045] bg-[linear-gradient(90deg,rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.25)_1px,transparent_1px)] bg-[size:42px_42px]" />

            {isCollectionHeader && (
              <div className="pointer-events-none absolute inset-x-6 bottom-0 h-[3px] rounded-full bg-[linear-gradient(90deg,#C8A45D_0%,#68A18B_48%,transparent_100%)] opacity-80" />
            )}

            <div className="relative flex flex-col gap-5 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8 md:py-6">
              <div className="min-w-0">
                {isCollectionHeader ? (
                  <a
                    href="/collections"
                    className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#DCEAE4] transition-colors duration-200 hover:text-[#E2C576] motion-reduce:transition-none"
                  >
                    <span aria-hidden="true">←</span>
                    All Collections
                  </a>
                ) : (
                  <div className="mb-2 flex items-center gap-2.5">
                    <span className="h-[2px] w-7 rounded-full bg-[#C8A45D]" />
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#D9B765]">
                      Catalog
                    </span>
                  </div>
                )}

                <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-white md:text-[2.5rem] md:leading-tight">
                  {headingTitle}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65 md:text-[15px]">
                  {headingDescription}
                </p>

                {(searchQuery || brandFilter || vehicleMakeFilter) && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#D9B765] transition-colors duration-200 hover:text-white motion-reduce:transition-none"
                  >
                    View all products
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-end gap-3">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="flex h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-white transition-colors duration-200 hover:bg-white/15 motion-reduce:transition-none md:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4 text-[#D9B765]" />
                  Filters
                  {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
                </button>

                <div className="relative z-[60] w-48 sm:w-52">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-white/65">
                    Sort products
                  </p>
                  <CatalogDropdown
                    value={sort}
                    options={sortOptions}
                    placeholder="Newest"
                    onChange={updateSort}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-30 mb-8 hidden rounded-[1.5rem] border border-[#B8C6BC] bg-[#CCD6CF] p-5 shadow-[0_10px_28px_rgba(17,17,17,0.065)] md:block">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#B6C2B9] pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F5A46] text-white shadow-[0_8px_18px_rgba(15,90,70,0.16)]">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>

                <div>
                  <h2 className="text-sm font-extrabold text-[#142019]">
                    Filter products
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold text-[#5D685F]">
                    {activeFiltersCount > 0
                      ? `${activeFiltersCount} filter${activeFiltersCount === 1 ? '' : 's'} applied`
                      : 'Choose one or more options'}
                  </p>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full border border-[#0F5A46]/15 bg-[#F4F3EE] px-4 py-2 text-xs font-bold text-[#0F5A46] transition-colors duration-200 hover:bg-[#0F5A46] hover:text-white motion-reduce:transition-none"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {availableFilters
                .filter((group) => group.options.length > 0)
                .map((group) => (
                  <CatalogDropdown
                    key={group.prefix}
                    label={group.label}
                    value={getCurrentFilterValue(group.prefix)}
                    options={group.options.map((tag) => ({
                      label: formatTag(tag, group.prefix),
                      value: tag,
                    }))}
                    placeholder="All"
                    onChange={(value) => updateFilter(group.prefix, value)}
                  />
                ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#B6C2B9] pt-4">
              <p className="text-sm font-semibold text-[#4E5C52]">
                Showing {showingStart}-{showingEnd} of {sortedProducts.length}{' '}
                product(s)
              </p>

              <p className="hidden text-xs font-semibold text-[#667168] lg:block">
                Options update with your selection
              </p>
            </div>
          </div>

          <p className="mb-5 text-sm text-[#717182] md:hidden">
            Showing {showingStart}-{showingEnd} of {sortedProducts.length}{' '}
            product(s)
          </p>

          <div id="catalog-results" className="scroll-mt-28" />

          {isLoading ? (
            <div className="grid animate-pulse grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({length: 8}).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-3xl border border-[#E5E0D6] bg-white shadow-sm"
                >
                  <div className="h-64 bg-[#ECE9E2] md:h-72" />
                  <div className="space-y-4 p-5">
                    <div className="h-4 w-24 rounded-full bg-[#ECE9E2]" />
                    <div className="h-5 w-full rounded-full bg-[#ECE9E2]" />
                    <div className="h-7 w-28 rounded-full bg-[#ECE9E2]" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="rounded-[2rem] border border-[#EAE7DF] bg-white/85 p-10 text-center shadow-sm">
              <p className="mb-2 font-bold text-[#111111]">No products found.</p>
              <p className="text-sm text-[#717182]">
                Try another search term or clear your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
                {paginatedProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 4}
                    isAdding={addingId === product.id}
                    onQuickAdd={handleQuickAdd}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={safeCurrentPage === 1}
                    onClick={() => goToPage(safeCurrentPage - 1)}
                    className="rounded-2xl border border-[#EAE7DF] bg-white px-4 py-3 text-sm font-bold text-[#111111] shadow-sm transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:bg-[#0F5A46] hover:text-white disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-[#111111] motion-reduce:transition-none"
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
                        className={`h-11 w-11 rounded-2xl text-sm font-bold transition-[transform,background-color,color] duration-200 motion-reduce:transition-none ${
                          safeCurrentPage === page
                            ? 'bg-[#0F5A46] text-white shadow-[0_8px_18px_rgba(15,90,70,0.18)]'
                            : 'border border-[#EAE7DF] bg-white text-[#111111] hover:-translate-y-0.5 hover:bg-[#0F5A46]/10 hover:text-[#0F5A46]'
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
                    className="rounded-2xl border border-[#EAE7DF] bg-white px-4 py-3 text-sm font-bold text-[#111111] shadow-sm transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:bg-[#0F5A46] hover:text-white disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-[#111111] motion-reduce:transition-none"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {filtersOpen &&
        createPortal(
          <div className="fixed inset-0 z-[999999] bg-black/70 md:hidden">
            <div className="fixed inset-0 z-[1000000] flex flex-col bg-[#E1E7E2]">
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0B1B16] px-6 py-5 text-white">
                <div>
                  <h3 className="text-xl font-extrabold">Filter products</h3>
                  <p className="mt-1 text-xs font-semibold text-white/55">
                    {activeFiltersCount > 0
                      ? `${activeFiltersCount} filter${activeFiltersCount === 1 ? '' : 's'} applied`
                      : 'Choose one or more options'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeFilters}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 motion-reduce:transition-none"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                <div className="space-y-4 pb-24">
                  {availableFilters
                    .filter((group) => group.options.length > 0)
                    .map((group) => (
                      <CatalogDropdown
                        key={group.prefix}
                        label={group.label}
                        value={getCurrentFilterValue(group.prefix)}
                        options={group.options.map((tag) => ({
                          label: formatTag(tag, group.prefix),
                          value: tag,
                        }))}
                        placeholder="All"
                        onChange={(value) => updateFilter(group.prefix, value)}
                      />
                    ))}
                </div>
              </div>

              <div className="shrink-0 border-t border-[#CDD6CF] bg-[#F6F4EF] px-5 pb-6 pt-4">
                <div className="flex gap-3">
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
                    onClick={closeFilters}
                    className="h-12 flex-1 rounded-2xl bg-[#0F5A46] text-white hover:bg-[#126B54]"
                  >
                    Show {sortedProducts.length}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}