import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  X,
} from 'lucide-react';
import {addToCart, createCart, getProducts} from '../../lib/shopify';
import {getShippingLabel} from '../../lib/shipping';

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

function getPriceInfo(product: any) {
  const selectedVariant = product?.selectedVariant || product?.variants?.[0];
  const price = Number(
    selectedVariant?.price?.amount ||
      product?.priceRange?.minVariantPrice?.amount ||
      0
  );
  const compareAtPrice = Number(
    selectedVariant?.compareAtPrice?.amount ||
      product?.compareAtPriceRange?.minVariantPrice?.amount ||
      0
  );
  const hasCompareAtPrice =
    Number.isFinite(compareAtPrice) && compareAtPrice > price;

  return {
    price,
    compareAtPrice,
    hasCompareAtPrice,
    discountPercent: hasCompareAtPrice
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0,
  };
}

async function saveCustomerCart(cart: any) {
  if (!cart?.id) return;

  try {
    await fetch('/api/cart/save', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({cart_id: cart.id, cart_data: cart}),
    });
  } catch {
    console.warn('Cart could not be synced.');
  }
}

const FeaturedProductCard = memo(function FeaturedProductCard({
  product,
  index,
  isAdding,
  isAdded,
  onQuickAdd,
}: {
  product: any;
  index: number;
  isAdding: boolean;
  isAdded: boolean;
  onQuickAdd: (product: any) => void;
}) {
  const isOutOfStock = product?.isOutOfStock || !product?.availableForSale;
  const {price, compareAtPrice, hasCompareAtPrice, discountPercent} =
    getPriceInfo(product);
  const shippingLabel = getShippingLabel(product);

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-[#EAE7DF] bg-white shadow-[0_8px_20px_rgba(17,17,17,0.05)] [content-visibility:auto] [contain-intrinsic-size:560px] ${
        isOutOfStock ? 'opacity-80' : ''
      } ${
        index >= 4
          ? 'hidden lg:block'
          : index >= 2
            ? 'hidden sm:block'
            : ''
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-[#F8F7F4]">
        <a
          href={`/product/${product.handle}`}
          aria-label={`View ${product.title}`}
          className="block h-full"
        >
          {product.featuredImage?.url ? (
            <img
              src={getOptimizedProductImage(product.featuredImage.url, 560)}
              alt={product.featuredImage.altText || product.title}
              loading="lazy"
              decoding="async"
              width="560"
              height="560"
              className={`h-full w-full object-cover ${
                isOutOfStock ? 'grayscale opacity-70' : ''
              }`}
            />
          ) : (
            <span className="flex h-full items-center justify-center text-sm text-[#717182]">
              No image
            </span>
          )}
        </a>

        {isOutOfStock ? (
          <span className="absolute left-4 right-4 top-4 rounded-full bg-[#111111] px-4 py-2 text-center text-xs font-extrabold uppercase tracking-[0.16em] text-white">
            Out of Stock
          </span>
        ) : (
          <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-[#0F5A46] px-3 py-1.5 text-xs font-bold text-white shadow-[0_6px_14px_rgba(15,90,70,0.18)]">
            <Star className="h-3.5 w-3.5 fill-[#C8A45D] text-[#C8A45D]" />
            Featured
          </span>
        )}

        {hasCompareAtPrice && !isOutOfStock && (
          <span className="absolute right-4 top-4 rounded-full bg-[#C8A45D] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white">
            Save {discountPercent}%
          </span>
        )}

        <div className="absolute inset-x-4 bottom-4 opacity-100 transition-opacity duration-200 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
          <button
            type="button"
            onClick={() => onQuickAdd(product)}
            disabled={isAdding || isOutOfStock}
            className={`flex h-10 w-full items-center justify-center rounded-xl text-sm font-bold text-white shadow-[0_6px_14px_rgba(15,90,70,0.18)] ${
              isOutOfStock
                ? 'cursor-not-allowed bg-[#717182]'
                : isAdded
                  ? 'bg-[#126B54]'
                  : 'bg-[#0F5A46] hover:bg-[#126B54]'
            }`}
          >
            {isAdded ? (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            ) : (
              <ShoppingCart className="mr-2 h-4 w-4" />
            )}
            {isOutOfStock
              ? 'Out of Stock'
              : isAdding
                ? 'Adding...'
                : isAdded
                  ? 'Added'
                  : 'Quick Add'}
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-center gap-1">
          <Star className="h-4 w-4 fill-[#C8A45D] text-[#C8A45D]" />
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#0F5A46]">
            {isOutOfStock ? 'Unavailable' : 'Featured'}
          </span>
        </div>

        <a href={`/product/${product.handle}`}>
          <h3 className="mb-3 line-clamp-2 text-base font-bold tracking-tight text-[#111111] transition-colors hover:text-[#0F5A46] md:text-lg">
            {product.title}
          </h3>
        </a>

        <div className="mb-3 flex flex-wrap items-end gap-2">
          <span className="text-2xl font-extrabold text-[#111111]">
            ${price.toFixed(2)}
          </span>
          {hasCompareAtPrice && (
            <span className="text-sm font-bold text-[#9CA3AF] line-through">
              ${compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F0EB] px-3 py-1 text-xs font-bold text-[#0F5A46]">
            <Truck className="h-3.5 w-3.5" />
            {shippingLabel}
          </span>
          <a
            href={`/product/${product.handle}`}
            className="text-xs font-semibold text-[#717182] hover:text-[#0F5A46]"
          >
            {isOutOfStock ? 'Unavailable' : 'View Details'}
          </a>
        </div>
      </div>
    </article>
  );
});

const PreviewCard = memo(function PreviewCard({product}: {product: any}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#EAE7DF] bg-white shadow-[0_6px_16px_rgba(17,17,17,0.035)] [content-visibility:auto] [contain-intrinsic-size:260px]">
      <div className="aspect-square overflow-hidden bg-[#F8F7F4]">
        {product.featuredImage?.url ? (
          <img
            src={getOptimizedProductImage(product.featuredImage.url, 320)}
            alt={product.featuredImage.altText || product.title}
            loading="lazy"
            decoding="async"
            width="320"
            height="320"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#717182]">
            No image
          </div>
        )}
      </div>
    </div>
  );
});

export function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState('');
  const [addedId, setAddedId] = useState('');
  const [message, setMessage] = useState('');
  const [cartToast, setCartToast] = useState<{
    title: string;
    image?: string;
  } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const addedTimer = useRef<number | null>(null);
  const addingProductRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const data = await getProducts();
        if (active) setProducts(Array.isArray(data) ? data : []);
      } catch {
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      active = false;
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
      if (addedTimer.current !== null) window.clearTimeout(addedTimer.current);
    };
  }, []);

  const featuredProducts = useMemo(
    () =>
      [...products]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 12),
    [products]
  );

  const mainProducts = featuredProducts.slice(0, 8);
  const previewProducts = featuredProducts.slice(8, 12);

  const showCartToast = useCallback((product: any) => {
    setCartToast({
      title: product.title,
      image: getOptimizedProductImage(product.featuredImage?.url, 120),
    });

    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setCartToast(null);
      toastTimer.current = null;
    }, 3500);
  }, []);

  const markProductAdded = useCallback((productId: string) => {
    setAddedId(productId);

    if (addedTimer.current !== null) window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => {
      setAddedId('');
      addedTimer.current = null;
    }, 2000);
  }, []);

  const handleQuickAdd = useCallback(
    async (product: any) => {
      const isOutOfStock = product?.isOutOfStock || !product?.availableForSale;
      const variantId =
        product?.selectedVariant?.id || product?.variants?.[0]?.id;

      if (isOutOfStock || !variantId || addingProductRef.current) return;

      addingProductRef.current = true;
      setAddingId(product.id);
      setMessage('');

      try {
        const currentCartId = localStorage.getItem('shopify_cart_id');
        let updatedCart = currentCartId
          ? await addToCart(currentCartId, variantId, 1)
          : await createCart(variantId, 1);

        if (!updatedCart || updatedCart.error) {
          if (currentCartId) {
            localStorage.removeItem('shopify_cart_id');
            updatedCart = await createCart(variantId, 1);
          }

          if (!updatedCart || updatedCart.error) {
            throw new Error(updatedCart?.message || 'Unable to add product');
          }
        }

        localStorage.setItem('shopify_cart_id', updatedCart.id);
        localStorage.setItem(
          'shopify_cart_quantity',
          String(updatedCart.totalQuantity || 1)
        );
        window.dispatchEvent(new Event('cartUpdated'));
        showCartToast(product);
        markProductAdded(product.id);
        void saveCustomerCart(updatedCart);
      } catch (error) {
        console.error(error);
        setMessage('The product could not be added. Please try again.');
      } finally {
        addingProductRef.current = false;
        setAddingId('');
      }
    },
    [markProductAdded, showCartToast]
  );

  return (
    <section className="performance-section relative overflow-hidden bg-[#F7F5F0] pb-6 pt-8 md:pb-8 md:pt-10 [content-visibility:auto] [contain-intrinsic-size:1500px]">
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white px-4 py-2 shadow-sm">
            <Sparkles className="h-4 w-4 text-[#C8A45D]" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#0F5A46]">
              Explore the Catalog
            </span>
          </div>

          <h2 className="mb-3 text-3xl font-bold tracking-tight text-[#111111] md:text-5xl">
            Catalog
          </h2>

          <p className="max-w-xl text-[#717182]">
            Discover products currently available for collectors, enthusiasts,
            and everyday shoppers.
          </p>
        </div>

        {message && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-[#D9AAA4] bg-[#FFF3F1] px-4 py-3 text-sm font-semibold text-[#8E342B]"
          >
            {message}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({length: 4}).map((_, index) => (
              <div
                key={index}
                className="h-[520px] rounded-3xl bg-[#E7E5DF]"
              />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="rounded-3xl border border-[#EAE7DF] bg-white p-10 text-center">
            <p className="text-[#717182]">No featured products found yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {mainProducts.map((product, index) => (
                <FeaturedProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  isAdding={addingId === product.id}
                  isAdded={addedId === product.id}
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </div>

            {previewProducts.length > 0 && (
              <div className="relative mt-8 h-64 overflow-hidden rounded-[2rem] [content-visibility:auto] [contain-intrinsic-size:256px]">
                <div className="pointer-events-none grid grid-cols-1 gap-7 opacity-40 sm:grid-cols-2 lg:grid-cols-4">
                  {previewProducts.map((product) => (
                    <PreviewCard key={product.id} product={product} />
                  ))}
                </div>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#F7F5F0]/35 to-[#F7F5F0]" />

                <div className="absolute inset-x-0 top-8 flex justify-center px-4">
                  <a
                    href="/catalog"
                    className="inline-flex items-center rounded-2xl bg-[#0F5A46] px-7 py-4 text-base font-bold text-white shadow-[0_10px_22px_rgba(15,90,70,0.2)] transition-colors hover:bg-[#126B54]"
                  >
                    Explore Full Inventory
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {cartToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-5 top-24 z-[99999] w-[calc(100%-2.5rem)] max-w-sm overflow-hidden rounded-2xl border border-[#D5DDD8] bg-white shadow-[0_14px_32px_rgba(17,17,17,0.15)]"
        >
          <div className="flex gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F8F7F3]">
              {cartToast.image ? (
                <img
                  src={cartToast.image}
                  alt=""
                  decoding="async"
                  width="120"
                  height="120"
                  className="h-full w-full object-cover"
                />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-[#0F5A46]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-[#111111]">
                Added to cart
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-[#717182]">
                {cartToast.title}
              </p>
              <a
                href="/cart"
                className="mt-2 inline-flex text-sm font-bold text-[#0F5A46] hover:underline"
              >
                View Cart →
              </a>
            </div>

            <button
              type="button"
              onClick={() => setCartToast(null)}
              aria-label="Close notification"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F2F3F1] text-[#717182] transition-colors hover:bg-[#0F5A46] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}