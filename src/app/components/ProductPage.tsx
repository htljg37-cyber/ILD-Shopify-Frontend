import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {SyntheticEvent} from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Heart,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  UserCircle,
} from 'lucide-react';
import {Button} from './ui/button';
import {addToCart, createCart, getProductByHandle} from '../../lib/shopify';
import {getShippingLabel} from '../../lib/shipping';
import {ProductDescription} from './ProductDescription';
import {RelatedProducts} from './RelatedProducts';
import {
  trackAddToCart,
  trackBeginCheckout,
  trackViewItem,
} from '../../lib/analytics';

const LOCAL_DELIVERY_ZIPS = [
  '92399',
  '92320',
  '92373',
  '92374',
  '92223',
  '92555',
  '92557',
];

const authLoginUrl = 'https://www.ildistributions.com/api/auth/login';
const wishlistLoginMessage =
  'To add this product to your wishlist, sign in or create an account using the account icon in the top-right corner.';

const productBenefits = [
  {icon: Truck, label: 'Fast Shipping'},
  {icon: ShieldCheck, label: 'Secure Checkout'},
  {icon: PackageCheck, label: 'Quality Products'},
];

function getOptimizedProductImage(url = '', width = 1200) {
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

function getSelectedVariant(product: any) {
  return product?.selectedVariant || product?.variants?.[0];
}

function getVariantId(product: any) {
  return getSelectedVariant(product)?.id || '';
}

async function readJsonResponse(response: Response) {
  const responseText = await response.text();
  if (!responseText.trim()) return null;

  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
}

function getDeliveryEstimate(tags: unknown[]) {
  for (const tag of tags) {
    if (typeof tag !== 'string') continue;

    const match = tag.trim().match(/^delivery_(\d{1,2})_(\d{1,2})$/i);
    if (!match) continue;

    const minimumDays = Number(match[1]);
    const maximumDays = Number(match[2]);

    if (
      minimumDays < 1 ||
      maximumDays < minimumDays ||
      maximumDays > 60
    ) {
      continue;
    }

    return `${minimumDays}–${maximumDays} business ${
      maximumDays === 1 ? 'day' : 'days'
    }`;
  }

  return '';
}

function getAnalyticsItem(product: any, quantity = 1) {
  const variant = getSelectedVariant(product);
  const itemPrice = Number(
    variant?.price?.amount ||
      product?.priceRange?.minVariantPrice?.amount ||
      0
  );
  const brandTag = product?.tags?.find((tag: string) =>
    tag.startsWith('brand_')
  );
  const categoryTag = product?.tags?.find((tag: string) =>
    tag.startsWith('category_')
  );

  return {
    item_id: variant?.id || product?.id || product?.handle,
    item_name: product?.title,
    item_brand: brandTag
      ? brandTag.replace('brand_', '').replaceAll('-', ' ')
      : 'IL Distributions',
    item_category: categoryTag
      ? categoryTag.replace('category_', '').replaceAll('-', ' ')
      : undefined,
    item_variant: variant?.title || undefined,
    price: itemPrice,
    quantity,
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

const ProductGallery = memo(function ProductGallery({
  product,
  isOutOfStock,
  onPrimaryImageReady,
}: {
  product: any;
  isOutOfStock: boolean;
  onPrimaryImageReady: () => void;
}) {
  const images = useMemo(
    () => product.images?.edges?.map((item: any) => item.node) || [],
    [product.images?.edges]
  );
  const firstImage = images[0]?.url || product.featuredImage?.url || '';
  const [selectedImage, setSelectedImage] = useState(firstImage);
  const mainImage = selectedImage || firstImage;

  const handlePrimaryImageLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;

      if (typeof image.decode !== 'function') {
        onPrimaryImageReady();
        return;
      }

      void image
        .decode()
        .catch(() => undefined)
        .finally(onPrimaryImageReady);
    },
    [onPrimaryImageReady]
  );

  return (
    <div>
      <div className="relative overflow-hidden rounded-[2rem] border border-[#D8DDD8] bg-white p-4 shadow-[0_12px_32px_rgba(17,17,17,0.07)] md:p-8">
        {isOutOfStock && (
          <div className="absolute left-6 right-6 top-6 z-20 rounded-full bg-[#111111] px-5 py-3 text-center text-xs font-extrabold uppercase tracking-[0.22em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
            Out of Stock
          </div>
        )}

        {mainImage ? (
          <img
            src={getOptimizedProductImage(mainImage, 1200)}
            alt={product.title}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            width="1200"
            height="1200"
            onLoad={handlePrimaryImageLoad}
            onError={onPrimaryImageReady}
            className={`relative z-10 h-[320px] w-full object-contain sm:h-[430px] lg:h-[560px] ${
              isOutOfStock ? 'opacity-70 grayscale' : ''
            }`}
          />
        ) : (
          <div className="relative z-10 flex h-[320px] items-center justify-center text-[#717182] sm:h-[430px] lg:h-[560px]">
            No image
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-5 flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:gap-4 md:overflow-visible md:pb-0">
          {images.map((image: any, index: number) => {
            const isSelected = selectedImage === image.url;

            return (
              <button
                key={image.id || image.url || index}
                type="button"
                onClick={() => setSelectedImage(image.url)}
                aria-label={`Show image ${index + 1} of ${product.title}`}
                aria-pressed={isSelected}
                className={`min-w-[88px] rounded-2xl border bg-white p-2 shadow-sm transition-[border-color,box-shadow] duration-200 md:p-3 ${
                  isSelected
                    ? 'border-[#0F5A46] ring-2 ring-[#0F5A46]/10'
                    : 'border-[#D8DDD8] hover:border-[#0F5A46]/40'
                }`}
              >
                <img
                  src={getOptimizedProductImage(image.url, 220)}
                  alt={image.altText || `${product.title} image ${index + 1}`}
                  loading={index < 5 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority="low"
                  width="220"
                  height="220"
                  className={`h-20 w-full object-contain md:h-24 ${
                    isOutOfStock ? 'opacity-70 grayscale' : ''
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

const BenefitCard = memo(function BenefitCard({
  icon: Icon,
  label,
}: (typeof productBenefits)[number]) {
  return (
    <div className="rounded-2xl border border-[#D8DDD8] bg-[#F8F7F3] p-4">
      <Icon className="mb-3 h-6 w-6 text-[#0F5A46]" />
      <p className="text-sm font-bold text-[#111111]">{label}</p>
    </div>
  );
});

const MemoizedProductDescription = memo(ProductDescription);
const MemoizedRelatedProducts = memo(RelatedProducts);

export function ProductPage({
  handle,
  onPageReady,
}: {
  handle: string;
  onPageReady?: () => void;
}) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [addedMessage, setAddedMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [wishlistMessage, setWishlistMessage] = useState('');
  const [wishlistAccessMessage, setWishlistAccessMessage] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [primaryImageReady, setPrimaryImageReady] = useState(false);
  const readyWasAnnouncedRef = useRef(false);

  const handlePrimaryImageReady = useCallback(() => {
    setPrimaryImageReady(true);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    setProduct(null);
    setPrimaryImageReady(false);
    readyWasAnnouncedRef.current = false;

    async function loadProduct() {
      try {
        const data = await getProductByHandle(handle);
        if (!active) return;

        setProduct(data || null);
        setLoadError(!data);
        setAddedMessage('');
        setActionError('');
        setWishlistMessage('');
        setWishlistAccessMessage('');
        setIsWishlisted(false);
      } catch {
        if (active) {
          setProduct(null);
          setLoadError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProduct();
    return () => {
      active = false;
    };
  }, [handle]);

  const primaryImageUrl =
    product?.images?.edges?.[0]?.node?.url || product?.featuredImage?.url || '';

  useEffect(() => {
    if (loading || readyWasAnnouncedRef.current) return;

    const contentIsReady =
      loadError || (product && (!primaryImageUrl || primaryImageReady));
    if (!contentIsReady) return;

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (readyWasAnnouncedRef.current) return;
        readyWasAnnouncedRef.current = true;
        onPageReady?.();
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [
    loadError,
    loading,
    onPageReady,
    primaryImageReady,
    primaryImageUrl,
    product,
  ]);

  useEffect(() => {
    if (!product?.id) return;
    const controller = new AbortController();

    async function loadWishlistStatus() {
      try {
        const response = await fetch('/api/wishlist/list', {
          signal: controller.signal,
          headers: {Accept: 'application/json'},
        });

        if (response.status === 401 || response.status === 403) {
          setIsWishlisted(false);
          return;
        }

        if (!response.ok) return;
        const data = await readJsonResponse(response);

        if (!controller.signal.aborted && data?.success && Array.isArray(data.items)) {
          setIsWishlisted(
            data.items.some((item: any) => item.product_id === product.id)
          );
        }
      } catch {
        if (!controller.signal.aborted) setIsWishlisted(false);
      }
    }

    loadWishlistStatus();
    return () => controller.abort();
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id) return;
    const variant = getSelectedVariant(product);
    const currency =
      variant?.price?.currencyCode ||
      product?.priceRange?.minVariantPrice?.currencyCode ||
      'USD';

    trackViewItem(getAnalyticsItem(product, 1), currency);
  }, [product?.id]);

  async function handleWishlistToggle() {
    if (!product || wishlistLoading) return;

    setWishlistLoading(true);
    setWishlistMessage('');
    setWishlistAccessMessage('');
    setActionError('');

    try {
      const customerResponse = await fetch('/api/customer/me', {
        headers: {Accept: 'application/json'},
      });
      const customerData = await readJsonResponse(customerResponse);
      const isSignedOut =
        customerResponse.status === 401 ||
        customerResponse.status === 403 ||
        (customerResponse.ok && customerData?.isLoggedIn !== true);

      if (isSignedOut) {
        setIsWishlisted(false);
        setWishlistAccessMessage(wishlistLoginMessage);
        return;
      }

      if (!customerResponse.ok || !customerData) {
        throw new Error(
          'To save products to your wishlist, first sign in or create an account using the account icon in the top-right corner.'
        );
      }

      const response = isWishlisted
        ? await fetch('/api/wishlist/remove', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({product_id: product.id}),
          })
        : await fetch('/api/wishlist/add', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              product_id: product.id,
              variant_id: getSelectedVariant(product)?.id || null,
              handle: product.handle,
              title: product.title,
              image_url: product.featuredImage?.url || null,
              price:
                getSelectedVariant(product)?.price?.amount ||
                product.priceRange?.minVariantPrice?.amount ||
                null,
            }),
          });

      if (response.status === 401 || response.status === 403) {
        setIsWishlisted(false);
        setWishlistAccessMessage(wishlistLoginMessage);
        return;
      }

      const data = await readJsonResponse(response);
      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error ||
            'The wishlist service did not return a valid response. Please try again.'
        );
      }

      const nextWishlisted = !isWishlisted;
      setIsWishlisted(nextWishlisted);
      setWishlistMessage(
        nextWishlisted ? 'Added to wishlist.' : 'Removed from wishlist.'
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Unable to update wishlist.'
      );
    } finally {
      setWishlistLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!product || adding) return;

    const isOutOfStock = product.isOutOfStock || !product.availableForSale;
    const variantId = getVariantId(product);
    const selectedVariant = getSelectedVariant(product);
    const currency =
      selectedVariant?.price?.currencyCode ||
      product?.priceRange?.minVariantPrice?.currencyCode ||
      'USD';

    if (isOutOfStock || !variantId) return;

    setAdding(true);
    setAddedMessage('');
    setActionError('');

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
          throw new Error(updatedCart?.message || 'Unable to add to cart.');
        }
      }

      localStorage.setItem('shopify_cart_id', updatedCart.id);
      localStorage.setItem(
        'shopify_cart_quantity',
        String(updatedCart.totalQuantity || 1)
      );
      window.dispatchEvent(new Event('cartUpdated'));
      trackAddToCart(getAnalyticsItem(product, 1), currency);
      setAddedMessage('Product added to cart.');
      void saveCustomerCart(updatedCart);
    } catch (error) {
      console.error(error);
      setActionError(
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    } finally {
      setAdding(false);
    }
  }

  async function handleBuyNow() {
    if (!product || buying) return;

    const isOutOfStock = product.isOutOfStock || !product.availableForSale;
    const variantId = getVariantId(product);
    if (isOutOfStock || !variantId) return;

    const selectedVariant = getSelectedVariant(product);
    const currency =
      selectedVariant?.price?.currencyCode ||
      product?.priceRange?.minVariantPrice?.currencyCode ||
      'USD';
    const item = getAnalyticsItem(product, 1);

    setBuying(true);
    setActionError('');

    try {
      const cart = await createCart(variantId, 1);

      if (!cart || cart.error) {
        throw new Error(cart?.message || 'Unable to start checkout.');
      }

      if (!cart.checkoutUrl) throw new Error('Unable to start checkout.');

      trackBeginCheckout([item], Number(item.price || 0), currency);
      window.setTimeout(() => {
        window.location.href = cart.checkoutUrl;
      }, 250);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Unable to start checkout.'
      );
    } finally {
      setBuying(false);
    }
  }

  if (loading || !product) {
    return (
      <section className="min-h-[500px] bg-[#F1F1EC] px-4 py-20">
        <div className="container mx-auto">
          <div className="rounded-3xl border border-[#D8DDD8] bg-white p-10 text-center shadow-sm">
            <p className={loadError ? 'font-semibold text-[#A13D32]' : 'text-[#717182]'}>
              {loadError ? 'This product could not be loaded.' : 'Loading product...'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const selectedVariant = getSelectedVariant(product);
  const price = Number(
    selectedVariant?.price?.amount ||
      product.priceRange?.minVariantPrice?.amount ||
      0
  );
  const compareAtPrice = Number(
    selectedVariant?.compareAtPrice?.amount ||
      product.compareAtPriceRange?.minVariantPrice?.amount ||
      0
  );
  const hasCompareAtPrice = compareAtPrice > price;
  const discountPercent = hasCompareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;
  const shippingLabel = getShippingLabel(product);
  const isOutOfStock = product.isOutOfStock || !product.availableForSale;
  const tags = product.tags || [];
  const deliveryEstimate = getDeliveryEstimate(tags);
  const hasLocalDelivery =
    tags.includes('shipping_local') ||
    tags.includes('shipping_local_free') ||
    tags.some((tag: string) => tag.startsWith('shipping_local_'));

  return (
    <main className="overflow-hidden bg-[#F1F1EC]">
      <section className="container mx-auto px-4 py-10 md:px-6 md:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductGallery
            key={product.id}
            product={product}
            isOutOfStock={isOutOfStock}
            onPrimaryImageReady={handlePrimaryImageReady}
          />

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[2rem] border border-[#D8DDD8] bg-white p-6 shadow-[0_12px_32px_rgba(17,17,17,0.07)] md:p-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-[#E7F0EB] px-4 py-2">
                <Sparkles className="h-4 w-4 text-[#C8A45D]" />
                <span className="text-sm font-bold text-[#0F5A46]">
                  IL Distributions LLC
                </span>
              </div>

              <div className="mb-5 flex items-start justify-between gap-4">
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#111111] sm:text-4xl md:text-5xl">
                  {product.title}
                </h1>

                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                  aria-label={
                    isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
                  }
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-[transform,border-color,background-color,color] duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 ${
                    isWishlisted
                      ? 'border-[#0F5A46]/20 bg-[#0F5A46] text-white'
                      : 'border-[#D8DDD8] bg-white text-[#111111] hover:border-[#0F5A46]/30 hover:bg-[#F5F5F5] hover:text-[#0F5A46]'
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`}
                  />
                </button>
              </div>

              {wishlistMessage && (
                <div className="mb-5 flex items-center gap-2 rounded-2xl border border-[#0F5A46]/15 bg-[#E7F0EB] px-4 py-3 text-sm font-bold text-[#0F5A46]">
                  <Heart className="h-4 w-4 fill-current" />
                  {wishlistMessage}
                </div>
              )}

              {wishlistAccessMessage && (
                <div
                  role="status"
                  className="mb-5 flex items-start gap-3 rounded-2xl border border-[#D9C27D] bg-[#FBF5E3] px-4 py-4 text-sm text-[#5F4A18]"
                >
                  <UserCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#8A6A24]" />
                  <div>
                    <p className="font-semibold leading-relaxed">
                      {wishlistAccessMessage}
                    </p>
                    <a
                      href={authLoginUrl}
                      className="mt-2 inline-flex font-extrabold text-[#0F5A46] underline decoration-[#0F5A46]/30 underline-offset-4 hover:decoration-[#0F5A46]"
                    >
                      Sign in or create an account
                    </a>
                  </div>
                </div>
              )}

              {actionError && (
                <div role="alert" className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {actionError}
                </div>
              )}

              <div className="mb-3 flex flex-wrap items-center gap-3">
                <p className="text-3xl font-extrabold text-[#111111] md:text-4xl">
                  ${price.toFixed(2)}
                </p>
                {hasCompareAtPrice && (
                  <p className="text-xl font-bold text-[#9CA3AF] line-through md:text-2xl">
                    ${compareAtPrice.toFixed(2)}
                  </p>
                )}
                {hasCompareAtPrice && (
                  <span className="rounded-full bg-[#E7F0EB] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#0F5A46]">
                    Save {discountPercent}%
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${
                    isOutOfStock
                      ? 'bg-[#111111]/10 text-[#111111]'
                      : 'bg-[#F2E8CA] text-[#8A6A24]'
                  }`}
                >
                  {isOutOfStock ? 'Out of Stock' : 'Available Now'}
                </span>
              </div>

              <div className="mb-6 flex flex-col items-start gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#E7F0EB] px-4 py-2 text-sm font-bold text-[#0F5A46]">
                  <Truck className="h-4 w-4" />
                  {shippingLabel}
                </div>

                {deliveryEstimate && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#F2E8CA] px-4 py-2 text-sm font-bold text-[#73591E]">
                    <Clock className="h-4 w-4" />
                    Estimated delivery: {deliveryEstimate}
                  </div>
                )}
              </div>

              {hasLocalDelivery && (
                <div className="mb-6 rounded-2xl border border-[#0F5A46]/20 bg-[#F1F6F3] p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-[#0F5A46]" />
                    <h3 className="font-bold text-[#0F5A46]">
                      Local Delivery Only
                    </h3>
                  </div>
                  <p className="mb-2 text-sm font-semibold text-[#111111]">
                    Available ZIP codes:
                  </p>
                  <p className="mb-4 text-sm text-[#111111]">
                    {LOCAL_DELIVERY_ZIPS.join(', ')}
                  </p>
                  <p className="text-sm text-[#717182]">
                    If your ZIP code is not listed, please contact us before
                    placing your order.
                  </p>
                </div>
              )}

              {isOutOfStock && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>
                    This product is currently out of stock and cannot be added
                    to cart or purchased at this time.
                  </span>
                </div>
              )}

              <MemoizedProductDescription
                html={product.descriptionHtml}
                tags={tags}
              />

              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={adding || isOutOfStock}
                  className={`h-14 rounded-2xl px-8 text-base text-white transition-[transform,background-color] duration-200 active:scale-[0.98] ${
                    isOutOfStock
                      ? 'cursor-not-allowed bg-[#717182] hover:bg-[#717182]'
                      : 'bg-[#0F5A46] hover:-translate-y-0.5 hover:bg-[#126B54]'
                  }`}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isOutOfStock
                    ? 'Out of Stock'
                    : adding
                      ? 'Adding...'
                      : 'Add to Cart'}
                </Button>

                <Button
                  onClick={handleBuyNow}
                  disabled={buying || isOutOfStock}
                  variant="outline"
                  className={`h-14 rounded-2xl border-[#0F5A46] bg-white text-base transition-[transform,background-color,color] duration-200 active:scale-[0.98] ${
                    isOutOfStock
                      ? 'cursor-not-allowed border-[#717182] text-[#717182] hover:bg-white hover:text-[#717182]'
                      : 'text-[#0F5A46] hover:-translate-y-0.5 hover:bg-[#0F5A46] hover:text-white'
                  }`}
                >
                  {isOutOfStock
                    ? 'Unavailable'
                    : buying
                      ? 'Opening checkout...'
                      : 'Buy Now'}
                  {!isOutOfStock && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </div>

              {addedMessage && (
                <div className="mb-6 flex items-center gap-2 rounded-2xl border border-[#0F5A46]/15 bg-[#E7F0EB] px-4 py-3 text-sm font-bold text-[#0F5A46]">
                  <CheckCircle2 className="h-5 w-5" />
                  {addedMessage}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {productBenefits.map((benefit) => (
                  <BenefitCard key={benefit.label} {...benefit} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="[content-visibility:auto] [contain-intrinsic-size:700px]">
        <MemoizedRelatedProducts currentProduct={product} />
      </div>
    </main>
  );
}