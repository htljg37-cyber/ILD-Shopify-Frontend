import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  Truck,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Button } from './ui/button';
import { getProducts, createCart, addToCart } from '../../lib/shopify';
import { getShippingLabel } from '../../lib/shipping';

const premiumHover =
  'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,90,70,0.14)] active:translate-y-0';

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

export function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [addingId, setAddingId] = useState<string>('');
  const [addedId, setAddedId] = useState<string>('');
  const [cartToast, setCartToast] = useState<{
    title: string;
    image?: string;
  } | null>(null);

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

  function showCartToast(product: any) {
    setCartToast({
      title: product.title,
      image: product.featuredImage?.url,
    });

    window.setTimeout(() => {
      setCartToast(null);
    }, 3500);
  }

  function markProductAdded(productId: string) {
    setAddedId(productId);

    window.setTimeout(() => {
      setAddedId('');
    }, 2000);
  }

  useEffect(() => {
    async function loadProducts() {
      const data = await getProducts();
      setProducts(data);
    }

    loadProducts();
  }, []);

  const featuredProducts = useMemo(() => {
  return [...products]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      return dateB - dateA;
    })
    .slice(0, 12);
}, [products]);

const mainProducts = featuredProducts.slice(0, 8);
const previewProducts = featuredProducts.slice(8, 12);

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
      let cartId = localStorage.getItem('shopify_cart_id');

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

        await saveCustomerCart(newCart);
      } else {
        const updatedCart = await addToCart(cartId, variantId, 1);

        if (!updatedCart || updatedCart.error) {
          localStorage.removeItem('shopify_cart_id');

          const newCart = await createCart(variantId, 1);

          if (!newCart || newCart.error) {
            alert(newCart?.message || 'Unable to add to cart.');
            setAddingId('');
            return;
          }

          localStorage.setItem('shopify_cart_id', newCart.id);
          localStorage.setItem(
            'shopify_cart_quantity',
            String(newCart.totalQuantity || 1)
          );

          await saveCustomerCart(newCart);
          window.dispatchEvent(new Event('cartUpdated'));
          showCartToast(product);
          markProductAdded(product.id);
          setAddingId('');
          return;
        }

        localStorage.setItem(
          'shopify_cart_quantity',
          String(updatedCart.totalQuantity || 1)
        );

        await saveCustomerCart(updatedCart);
      }

      window.dispatchEvent(new Event('cartUpdated'));
      showCartToast(product);
      markProductAdded(product.id);
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }

    setAddingId('');
  }

  return (
    <section className="relative overflow-hidden py-18 md:py-24 bg-[radial-gradient(circle_at_12%_10%,rgba(15,90,70,0.08),transparent_26%),radial-gradient(circle_at_88%_20%,rgba(200,164,93,0.10),transparent_28%),linear-gradient(180deg,#FAFAFA_0%,#F6F4EF_100%)]">
      <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-12">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white/70 px-4 py-2 shadow-sm mb-4"
            >
              <Sparkles className="h-4 w-4 text-[#C8A45D]" />
              <span className="text-sm font-semibold text-[#0F5A46]">
                Premium Picks
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold tracking-tight text-[#111111] mb-3"
            >
              Featured Products
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#717182] max-w-xl"
            >
              Selected products from our current catalog, curated for collectors,
              enthusiasts, and premium everyday shoppers.
            </motion.p>
          </div>

        </div>

        {featuredProducts.length === 0 ? (
          <div className="bg-white/80 rounded-3xl border border-gray-100 p-10 text-center shadow-sm">
            <p className="text-[#717182]">No featured products found yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
        
            {mainProducts.map((product, index) => {
              const isOutOfStock =
                product?.isOutOfStock || !product?.availableForSale;

              const {
                price,
                compareAtPrice,
                hasCompareAtPrice,
                discountPercent,
              } = getPriceInfo(product);

              const shippingLabel = getShippingLabel(product);
              const isAdding = addingId === product.id;
              const isAdded = addedId === product.id;

              return (
                <motion.a
                  href={`/product/${product.handle}`}
                  key={product.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ delay: index * 0.06, duration: 0.45 }}
                  className={`group relative block overflow-hidden rounded-3xl border border-[#EAE7DF] bg-white/85 backdrop-blur-sm shadow-[0_10px_30px_rgba(17,17,17,0.04)] ${
                    isOutOfStock ? 'opacity-80' : premiumHover
                  } ${
                    index >= 4
                      ? 'hidden lg:block'
                      : index >= 2
                        ? 'hidden sm:block'
                        : ''
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_0%,rgba(200,164,93,0.18),transparent_35%)]" />

                  <div className="relative aspect-square overflow-hidden bg-[#F8F7F4]">
                    {product.featuredImage?.url ? (
                      <img
                        src={product.featuredImage.url}
                        alt={product.featuredImage?.altText || product.title}
                        className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${
                          isOutOfStock ? 'grayscale opacity-70' : ''
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#717182]">
                        No image
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {isOutOfStock ? (
                      <div className="absolute top-4 left-4 right-4 rounded-full bg-[#111111] text-white text-xs font-extrabold uppercase tracking-[0.18em] px-4 py-2 text-center shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
                        Out of Stock
                      </div>
                    ) : (
                      <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-[#0F5A46] text-white text-xs font-bold px-3 py-1.5 shadow-[0_8px_20px_rgba(15,90,70,0.25)]">
                        <Star className="h-3.5 w-3.5 fill-[#C8A45D] text-[#C8A45D]" />
                        Featured
                      </div>
                    )}

                    {hasCompareAtPrice && !isOutOfStock && (
                      <div className="absolute top-4 right-4 rounded-full bg-[#C8A45D] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_8px_20px_rgba(200,164,93,0.28)]">
                        Save {discountPercent}%
                      </div>
                    )}

                    <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                      <Button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleQuickAdd(product);
                        }}
                        disabled={isAdding || isOutOfStock}
                        className={`w-full shadow-[0_12px_28px_rgba(15,90,70,0.30)] transition-all duration-300 hover:-translate-y-0.5 ${
                          isOutOfStock
                            ? 'cursor-not-allowed bg-[#717182] hover:bg-[#717182] text-white'
                            : isAdded
                              ? 'bg-[#126B54] hover:bg-[#126B54] text-white'
                              : 'bg-[#0F5A46] hover:bg-[#126B54] text-white'
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
                      </Button>
                    </div>
                  </div>

                  <div className="relative p-5">
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 fill-[#C8A45D] text-[#C8A45D]" />
                      <span className="text-xs uppercase tracking-[0.18em] font-bold text-[#0F5A46]">
                        {isOutOfStock ? 'Unavailable' : 'Featured'}
                      </span>
                    </div>

                    <h3 className="text-base md:text-lg font-bold tracking-tight text-[#111111] mb-3 line-clamp-2 group-hover:text-[#0F5A46] transition-colors duration-300">
                      {product.title}
                    </h3>

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
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F5A46]/8 px-3 py-1 text-xs font-bold text-[#0F5A46]">
                        <Truck className="h-3.5 w-3.5" />
                        {shippingLabel}
                      </span>

                      <span className="text-xs font-semibold text-[#717182] group-hover:text-[#C8A45D] transition-colors">
                        {isOutOfStock ? 'Unavailable' : 'View Details'}
                      </span>
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </div>

          {previewProducts.length > 0 && (
            <div className="relative mt-8 h-64 overflow-hidden rounded-[2rem]">
              <div className="pointer-events-none grid grid-cols-1 gap-7 opacity-45 sm:grid-cols-2 lg:grid-cols-4 [mask-image:linear-gradient(to_bottom,black_5%,transparent_95%)]">
                {previewProducts.map((product) => (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-3xl border border-[#EAE7DF] bg-white/85 shadow-[0_10px_30px_rgba(17,17,17,0.04)]"
                  >
                    <div className="aspect-square overflow-hidden bg-[#F8F7F4]">
                      {product.featuredImage?.url ? (
                        <img
                          src={product.featuredImage.url}
                          alt={
                            product.featuredImage?.altText ||
                            product.title
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#717182]">
                          No image
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-[#F6F4EF]/35 to-[#F6F4EF]" />

              <div className="absolute inset-x-0 top-8 z-20 flex justify-center px-4">
                <a
                  href="/catalog"
                  className="group inline-flex items-center rounded-2xl bg-[#0F5A46] px-7 py-4 text-base font-bold text-white shadow-[0_16px_38px_rgba(15,90,70,0.32)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#126B54] hover:shadow-[0_20px_48px_rgba(15,90,70,0.40)]"
                >
                  Explore Full Inventory
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          )}
        </>
      )}   
        
        
      </div>

      <AnimatePresence>
        {cartToast && (
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-5 top-24 z-[99999] w-[calc(100%-2.5rem)] max-w-sm overflow-hidden rounded-2xl border border-[#EAE7DF] bg-white shadow-[0_20px_60px_rgba(17,17,17,0.18)]"
          >
            <div className="flex gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F8F7F3]">
                {cartToast.image ? (
                  <img
                    src={cartToast.image}
                    alt={cartToast.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-[#0F5A46]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0F5A46]" />
                  <p className="text-sm font-extrabold text-[#111111]">
                    Added to cart
                  </p>
                </div>

                <p className="line-clamp-2 text-sm text-[#717182]">
                  {cartToast.title}
                </p>

                <a
                  href="/cart"
                  className="mt-3 inline-flex text-sm font-bold text-[#0F5A46] hover:text-[#C8A45D]"
                >
                  View Cart →
                </a>
              </div>

              <button
                type="button"
                onClick={() => setCartToast(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[#717182] transition hover:bg-[#0F5A46] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}