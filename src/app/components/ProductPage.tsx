import { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Truck,
  ShieldCheck,
  PackageCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Heart,
} from 'lucide-react';
import { Button } from './ui/button';
import { getProductByHandle, createCart, addToCart } from '../../lib/shopify';
import { getShippingLabel } from '../../lib/shipping';
import { ProductDescription } from './ProductDescription';
import { RelatedProducts } from './RelatedProducts';
import {
  trackViewItem,
  trackAddToCart,
  trackBeginCheckout,
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

export function ProductPage({ handle }: { handle: string }) {
  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [addedMessage, setAddedMessage] = useState('');
  const [wishlistMessage, setWishlistMessage] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      const data = await getProductByHandle(handle);
      setProduct(data);

      const firstImage =
        data?.images?.edges?.[0]?.node?.url || data?.featuredImage?.url || '';

      setSelectedImage(firstImage);
      setAddedMessage('');
      setWishlistMessage('');
      setIsWishlisted(false);
    }

    loadProduct();
  }, [handle]);

  useEffect(() => {
    async function loadWishlistStatus() {
      if (!product?.id) return;

      try {
        const response = await fetch('/api/wishlist/list');
        const data = await response.json();

        if (response.status === 401) {
          setIsWishlisted(false);
          return;
        }

        if (data?.success && Array.isArray(data.items)) {
          setIsWishlisted(
            data.items.some((item: any) => item.product_id === product.id)
          );
        }
      } catch {
        setIsWishlisted(false);
      }
    }

    loadWishlistStatus();
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id) return;

    const variant = product?.selectedVariant || product?.variants?.[0];

    const currency =
      variant?.price?.currencyCode ||
      product?.priceRange?.minVariantPrice?.currencyCode ||
      'USD';

    trackViewItem(getAnalyticsItem(1), currency);
  }, [product?.id]);

  function getVariantId() {
    return product?.selectedVariant?.id || product?.variants?.[0]?.id || '';
  }

  function getAnalyticsItem(quantity = 1) {
    const variant = product?.selectedVariant || product?.variants?.[0];

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_id: cart.id,
          cart_data: cart,
        }),
      });
    } catch {
      console.warn('Cart could not be synced.');
    }
  }

  async function handleWishlistToggle() {
    if (!product || wishlistLoading) return;

    setWishlistLoading(true);
    setWishlistMessage('');

    try {
      if (isWishlisted) {
        const response = await fetch('/api/wishlist/remove', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: product.id,
          }),
        });

        const data = await response.json();

        if (data?.success) {
          setIsWishlisted(false);
          setWishlistMessage('Removed from wishlist.');
          return;
        }

        alert(data?.error || 'Unable to remove from wishlist.');
      } else {
        const selectedVariant =
          product?.selectedVariant || product?.variants?.[0];

        const response = await fetch('/api/wishlist/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: product.id,
            variant_id: selectedVariant?.id || null,
            handle: product.handle,
            title: product.title,
            image_url: product.featuredImage?.url || null,
            price:
              selectedVariant?.price?.amount ||
              product.priceRange?.minVariantPrice?.amount ||
              null,
          }),
        });

        const data = await response.json();

        if (response.status === 401) {
          window.location.href = authLoginUrl;
          return;
        }

        if (data?.success) {
          setIsWishlisted(true);
          setWishlistMessage('Added to wishlist.');
          return;
        }

        alert(data?.error || 'Unable to add to wishlist.');
      }
    } catch {
      alert('Unable to update wishlist.');
    } finally {
      setWishlistLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!product) return;

    const isOutOfStock = product?.isOutOfStock || !product?.availableForSale;
    const variantId = getVariantId();
    const selectedVariant =
      product?.selectedVariant || product?.variants?.[0];

    const currency =
      selectedVariant?.price?.currencyCode ||
      product?.priceRange?.minVariantPrice?.currencyCode ||
      'USD';

    if (isOutOfStock) {
      alert('This product is currently out of stock.');
      return;
    }

    if (!variantId) {
      alert('This product does not have an available variant.');
      return;
    }

    setAdding(true);
    setAddedMessage('');

    try {
      const cartId = localStorage.getItem('shopify_cart_id');

      if (!cartId) {
        const newCart = await createCart(variantId, 1);

        if (!newCart || newCart.error) {
          alert(newCart?.message || 'Unable to create cart.');
          setAdding(false);
          return;
        }

        localStorage.setItem('shopify_cart_id', newCart.id);
        localStorage.setItem(
          'shopify_cart_quantity',
          String(newCart.totalQuantity || 1)
        );
        
        await saveCustomerCart(newCart);

        trackAddToCart(getAnalyticsItem(1), currency);
      } else {
        const updatedCart = await addToCart(cartId, variantId, 1);

        if (!updatedCart || updatedCart.error) {
          localStorage.removeItem('shopify_cart_id');

          const newCart = await createCart(variantId, 1);

          if (!newCart || newCart.error) {
            alert(newCart?.message || 'Unable to add to cart.');
            setAdding(false);
            return;
          }

          localStorage.setItem('shopify_cart_id', newCart.id);
          localStorage.setItem(
            'shopify_cart_quantity',
            String(newCart.totalQuantity || 1)
          );

          await saveCustomerCart(newCart);

          trackAddToCart(getAnalyticsItem(1), currency);

          setAddedMessage('Product added to cart.');
          window.dispatchEvent(new Event('cartUpdated'));
          setAdding(false);
          return;
        }

        localStorage.setItem(
          'shopify_cart_quantity',
          String(updatedCart.totalQuantity || 1)
        );
        
        await saveCustomerCart(updatedCart);

        trackAddToCart(getAnalyticsItem(1), currency);
      }

      setAddedMessage('Product added to cart.');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }

    setAdding(false);
  }

  async function handleBuyNow() {
    if (!product) return;

    const isOutOfStock = product?.isOutOfStock || !product?.availableForSale;
    const variantId = getVariantId();

    const selectedVariant =
      product?.selectedVariant || product?.variants?.[0];

    const currency =
      selectedVariant?.price?.currencyCode ||
      product?.priceRange?.minVariantPrice?.currencyCode ||
      'USD';

    const item = getAnalyticsItem(1);
    const checkoutValue = Number(item.price || 0);

    if (isOutOfStock) {
      alert('This product is currently out of stock.');
      return;
    }

    if (!variantId) {
      alert('No variant found.');
      return;
    }

    setBuying(true);

    const cart = await createCart(variantId, 1);

    setBuying(false);

    if (cart?.error) {
      alert(cart.message || 'This product is currently out of stock.');
      return;
    }

    if (cart?.checkoutUrl) {
      trackBeginCheckout([item], checkoutValue, currency);

      window.setTimeout(() => {
        window.location.href = cart.checkoutUrl;
      }, 250);
    } else {
      alert('Unable to start checkout.');
    }
  }

  if (!product) {
    return (
      <section className="relative min-h-[500px] bg-[linear-gradient(180deg,#FAFAFA_0%,#F6F4EF_100%)] px-4 py-20">
        <div className="container mx-auto">
          <div className="rounded-3xl border border-[#EAE7DF] bg-white/80 p-10 text-center shadow-sm">
            <p className="text-[#717182]">Loading product...</p>
          </div>
        </div>
      </section>
    );
  }

  const images = product.images?.edges?.map((item: any) => item.node) || [];
  const mainImage = selectedImage || product.featuredImage?.url;
  const selectedVariant = product?.selectedVariant || product?.variants?.[0];

  const price = Number(
    selectedVariant?.price?.amount ||
      product.priceRange?.minVariantPrice?.amount ||
      0
  );

  const compareAtPriceAmount =
    selectedVariant?.compareAtPrice?.amount ||
    product.compareAtPriceRange?.minVariantPrice?.amount ||
    null;

  const compareAtPrice = compareAtPriceAmount ? Number(compareAtPriceAmount) : 0;

  const hasCompareAtPrice =
    compareAtPriceAmount !== null &&
    !Number.isNaN(compareAtPrice) &&
    compareAtPrice > price;

  const discountPercent = hasCompareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const shippingLabel = getShippingLabel(product);
  const isOutOfStock = product?.isOutOfStock || !product?.availableForSale;
  const tags = product?.tags || [];

  const hasLocalDelivery =
    tags.includes('shipping_local') ||
    tags.includes('shipping_local_free') ||
    tags.some((tag: string) => tag.startsWith('shipping_local_'));

  return (
    <main className="relative overflow-hidden bg-[radial-gradient(circle_at_10%_10%,rgba(15,90,70,0.07),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(200,164,93,0.10),transparent_28%),linear-gradient(180deg,#FAFAFA_0%,#F6F4EF_100%)]">
      <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <section className="container relative z-10 mx-auto px-4 py-10 md:px-6 md:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="group relative overflow-hidden rounded-[2rem] border border-[#EAE7DF] bg-white/85 p-4 shadow-[0_18px_55px_rgba(17,17,17,0.06)] backdrop-blur-sm md:p-8">
              {isOutOfStock && (
                <div className="absolute left-6 right-6 top-6 z-20 rounded-full bg-[#111111] px-5 py-3 text-center text-xs font-extrabold uppercase tracking-[0.22em] text-white shadow-[0_14px_35px_rgba(0,0,0,0.28)]">
                  Out of Stock
                </div>
              )}

              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.title}
                  className={`relative z-10 h-[320px] w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.04] sm:h-[430px] lg:h-[560px] ${
                    isOutOfStock ? 'grayscale opacity-70' : ''
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
                {images.map((image: any, index: number) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImage(image.url)}
                    className={`group min-w-[88px] rounded-2xl border bg-white/85 p-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,90,70,0.12)] md:p-3 ${
                      selectedImage === image.url
                        ? 'border-[#0F5A46] ring-2 ring-[#0F5A46]/10'
                        : 'border-[#EAE7DF] hover:border-[#0F5A46]/35'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.altText || product.title}
                      className={`h-20 w-full object-contain transition-transform duration-300 group-hover:scale-105 md:h-24 ${
                        isOutOfStock ? 'grayscale opacity-70' : ''
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[2rem] border border-[#EAE7DF] bg-white/88 p-6 shadow-[0_18px_55px_rgba(17,17,17,0.06)] backdrop-blur-sm md:p-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-[#0F5A46]/8 px-4 py-2">
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
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 ${
                    isWishlisted
                      ? 'border-[#0F5A46]/20 bg-[#0F5A46] text-white shadow-[0_12px_28px_rgba(15,90,70,0.22)]'
                      : 'border-[#EAE7DF] bg-white text-[#111111] hover:border-[#0F5A46]/25 hover:bg-[#F5F5F5] hover:text-[#0F5A46]'
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`}
                  />
                </button>
              </div>

              {wishlistMessage && (
                <div className="mb-5 flex items-center gap-2 rounded-2xl border border-[#0F5A46]/15 bg-[#0F5A46]/8 px-4 py-3 text-sm font-bold text-[#0F5A46]">
                  <Heart className="h-4 w-4 fill-current" />
                  {wishlistMessage}
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
                  <span className="rounded-full bg-[#0F5A46]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#0F5A46]">
                    Save {discountPercent}%
                  </span>
                )}

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${
                    isOutOfStock
                      ? 'bg-[#111111]/10 text-[#111111]'
                      : 'bg-[#C8A45D]/12 text-[#8A6A24]'
                  }`}
                >
                  {isOutOfStock ? 'Out of Stock' : 'Premium Pick'}
                </span>
              </div>

              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#0F5A46]/8 px-4 py-2 text-sm font-bold text-[#0F5A46]">
                <Truck className="h-4 w-4" />
                {shippingLabel}
              </div>

              {hasLocalDelivery && (
                <div className="mb-6 rounded-2xl border border-[#0F5A46]/20 bg-[#0F5A46]/5 p-5">
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

              <ProductDescription html={product.descriptionHtml} tags={tags} />

              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={adding || isOutOfStock}
                  className={`h-14 rounded-2xl px-8 text-base text-white shadow-[0_12px_30px_rgba(15,90,70,0.28)] transition-all duration-300 ease-out active:translate-y-0 active:scale-[0.98] ${
                    isOutOfStock
                      ? 'cursor-not-allowed bg-[#717182] hover:bg-[#717182]'
                      : 'bg-[#0F5A46] hover:-translate-y-1 hover:bg-[#126B54] hover:shadow-[0_18px_42px_rgba(15,90,70,0.38)]'
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
                  className={`h-14 rounded-2xl border-[#0F5A46] bg-white text-base transition-all duration-300 ease-out active:translate-y-0 active:scale-[0.98] ${
                    isOutOfStock
                      ? 'cursor-not-allowed border-[#717182] text-[#717182] hover:bg-white hover:text-[#717182]'
                      : 'text-[#0F5A46] hover:-translate-y-1 hover:bg-[#0F5A46] hover:text-white hover:shadow-[0_18px_42px_rgba(15,90,70,0.18)]'
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
                <div className="mb-6 flex items-center gap-2 rounded-2xl border border-[#0F5A46]/15 bg-[#0F5A46]/8 px-4 py-3 text-sm font-bold text-[#0F5A46]">
                  <CheckCircle2 className="h-5 w-5" />
                  {addedMessage}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  [Truck, 'Fast Shipping'],
                  [ShieldCheck, 'Secure Checkout'],
                  [PackageCheck, 'Quality Products'],
                ].map(([Icon, label]) => (
                  <div
                    key={label as string}
                    className="group rounded-2xl border border-[#EAE7DF] bg-[#F8F7F3] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,90,70,0.10)]"
                  >
                    <Icon className="mb-3 h-6 w-6 text-[#0F5A46]" />
                    <p className="text-sm font-bold text-[#111111]">
                      {label as string}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <RelatedProducts currentProduct={product} />
    </main>
  );
}