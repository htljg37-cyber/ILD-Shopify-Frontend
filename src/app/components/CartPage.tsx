import {memo, useCallback, useEffect, useState} from 'react';
import {
  ArrowRight,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
} from 'lucide-react';
import {getCart, removeCartLine, updateCartLine} from '../../lib/shopify';

function getOptimizedImageUrl(url?: string) {
  if (!url) return '';
  try {
    const nextUrl = new URL(url);
    if (nextUrl.hostname.includes('cdn.shopify.com')) {
      nextUrl.searchParams.set('width', '360');
    }
    return nextUrl.toString();
  } catch {
    return url;
  }
}

async function saveCustomerCart(updatedCart: any) {
  if (!updatedCart?.id) return;
  try {
    await fetch('/api/cart/save', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({cart_id: updatedCart.id, cart_data: updatedCart}),
    });
  } catch {
    console.warn('Cart could not be synced.');
  }
}

async function clearCustomerCart() {
  try {
    await fetch('/api/cart/clear', {method: 'DELETE'});
  } catch {
    console.warn('Saved cart could not be cleared.');
  }
}

const CartLine = memo(function CartLine({
  item,
  priority,
  updating,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  item: any;
  priority: boolean;
  updating: boolean;
  onIncrease: (lineId: string, quantity: number) => void;
  onDecrease: (lineId: string, quantity: number) => void;
  onRemove: (lineId: string) => void;
}) {
  const line = item.node;
  const product = line.merchandise.product;
  const price =
    line.cost?.totalAmount?.amount || line.merchandise?.price?.amount || '0.00';

  return (
    <article className="rounded-[1.5rem] border border-[#B9C5BE] bg-[#F7F5F0] p-4 shadow-[0_8px_20px_rgba(24,48,40,0.07)] sm:p-5 [content-visibility:auto] [contain-intrinsic-size:190px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
        <a
          href={`/product/${product.handle}`}
          className="flex h-48 shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem] border border-[#D6DDD8] bg-white p-3 sm:h-36 sm:w-36"
        >
          {product.featuredImage?.url ? (
            <img
              src={getOptimizedImageUrl(product.featuredImage.url)}
              alt={product.featuredImage.altText || product.title}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={priority ? 'high' : 'auto'}
              width="360"
              height="360"
              className="h-full w-full object-contain"
            />
          ) : (
            <ShoppingCart className="h-9 w-9 text-[#9BAB9F]" />
          )}
        </a>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <a href={`/product/${product.handle}`}>
              <h2 className="line-clamp-2 text-base font-extrabold leading-snug text-[#17251F] transition-colors hover:text-[#0F5A46] sm:text-lg">
                {product.title}
              </h2>
            </a>
            <p className="mt-2 text-xl font-extrabold text-[#0F5A46]">
              ${Number(price).toFixed(2)}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 sm:justify-start">
            <div className="flex items-center rounded-xl border border-[#C6CEC8] bg-white p-1">
              <button
                type="button"
                disabled={updating}
                onClick={() => onDecrease(line.id, line.quantity)}
                aria-label={`Decrease quantity of ${product.title}`}
                className="h-9 w-9 rounded-lg text-lg font-bold text-[#17251F] transition-colors hover:bg-[#E4ECE7] disabled:cursor-wait disabled:opacity-45"
              >
                −
              </button>
              <span className="min-w-10 text-center text-sm font-extrabold text-[#17251F]">
                {line.quantity}
              </span>
              <button
                type="button"
                disabled={updating}
                onClick={() => onIncrease(line.id, line.quantity)}
                aria-label={`Increase quantity of ${product.title}`}
                className="h-9 w-9 rounded-lg text-lg font-bold text-[#17251F] transition-colors hover:bg-[#E4ECE7] disabled:cursor-wait disabled:opacity-45"
              >
                +
              </button>
            </div>

            <button
              type="button"
              disabled={updating}
              onClick={() => onRemove(line.id)}
              aria-label={`Remove ${product.title} from cart`}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E4BDB8] bg-[#FFF8F7] text-[#A13D32] transition-colors hover:bg-[#A13D32] hover:text-white disabled:cursor-wait disabled:opacity-45"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
});

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingLineIds, setUpdatingLineIds] = useState<Set<string>>(
    () => new Set()
  );
  const [cartError, setCartError] = useState('');

  const applyCart = useCallback((updatedCart: any) => {
    setCart(updatedCart);
    localStorage.setItem(
      'shopify_cart_quantity',
      String(updatedCart?.totalQuantity || 0)
    );
    window.dispatchEvent(new Event('cartUpdated'));
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCart() {
      setLoading(true);
      let cartId: string | null = localStorage.getItem('shopify_cart_id');

      if (!cartId) {
        try {
          const response = await fetch('/api/cart/load');
          const savedCart = response.ok ? await response.json() : null;
          if (savedCart?.success && savedCart?.cart?.shopify_cart_id) {
            const savedCartId = String(savedCart.cart.shopify_cart_id);
            cartId = savedCartId;
            localStorage.setItem('shopify_cart_id', savedCartId);
          }
        } catch {
          console.warn('Saved cart could not be loaded.');
        }
      }

      if (!active) return;

      if (!cartId) {
        applyCart(null);
        setLoading(false);
        return;
      }

      try {
        const shopifyCart = await getCart(cartId);
        if (!active) return;

        if (!shopifyCart || shopifyCart.error) {
          localStorage.removeItem('shopify_cart_id');
          applyCart(null);
        } else {
          applyCart(shopifyCart);
          void saveCustomerCart(shopifyCart);
        }
      } catch {
        if (active) {
          applyCart(null);
          setCartError('Your cart could not be loaded. Please refresh the page.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCart();
    return () => {
      active = false;
    };
  }, [applyCart]);

  const updateLine = useCallback(
    async (lineId: string, operation: () => Promise<any>) => {
      setCartError('');
      setUpdatingLineIds((current) => new Set(current).add(lineId));

      try {
        const updatedCart = await operation();
        if (!updatedCart || updatedCart.error) throw new Error('Cart update failed');

        applyCart(updatedCart);

        if ((updatedCart.totalQuantity || 0) === 0) {
          localStorage.removeItem('shopify_cart_id');
          await clearCustomerCart();
        } else {
          await saveCustomerCart(updatedCart);
        }
      } catch {
        setCartError('The cart could not be updated. Please try again.');
      } finally {
        setUpdatingLineIds((current) => {
          const next = new Set(current);
          next.delete(lineId);
          return next;
        });
      }
    },
    [applyCart]
  );

  const increaseQuantity = useCallback(
    (lineId: string, quantity: number) => {
      const cartId = localStorage.getItem('shopify_cart_id');
      if (!cartId) return;
      void updateLine(lineId, () =>
        updateCartLine(cartId, lineId, quantity + 1)
      );
    },
    [updateLine]
  );

  const removeItem = useCallback(
    (lineId: string) => {
      const cartId = localStorage.getItem('shopify_cart_id');
      if (!cartId) return;
      void updateLine(lineId, () => removeCartLine(cartId, lineId));
    },
    [updateLine]
  );

  const decreaseQuantity = useCallback(
    (lineId: string, quantity: number) => {
      const cartId = localStorage.getItem('shopify_cart_id');
      if (!cartId) return;
      if (quantity <= 1) {
        removeItem(lineId);
        return;
      }
      void updateLine(lineId, () =>
        updateCartLine(cartId, lineId, quantity - 1)
      );
    },
    [removeItem, updateLine]
  );

  const lines = cart?.lines?.edges || [];

  function handleCheckout() {
    if (lines.length === 0) return;

    const cartItems = lines
      .map((item: any) => {
        const variantId = item.node.merchandise.id.split('/').pop();
        return `${variantId}:${item.node.quantity}`;
      })
      .join(',');

    window.location.href =
      `https://il-distributions-llc.myshopify.com/cart/${cartItems}`;
  }

  return (
    <main className="min-h-screen bg-[#CDD6CF] px-4 py-8 sm:px-6 md:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-col justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-[#123F34] px-6 py-7 sm:flex-row sm:items-end sm:px-8">
          <div>
            <div className="flex items-center gap-2 text-[#D8BE6B]">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-[0.14em]">
                Shopping Cart
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] text-white sm:text-4xl">
              Review your cart
            </h1>
          </div>
          {!loading && lines.length > 0 && (
            <p className="text-sm font-semibold text-[#C5D0CB]">
              {cart.totalQuantity} {cart.totalQuantity === 1 ? 'item' : 'items'}
            </p>
          )}
        </header>

        {loading ? (
          <div className="rounded-[1.5rem] border border-[#B9C5BE] bg-[#E2E7E3] p-10 text-center text-sm font-semibold text-[#68756E]">
            Loading cart...
          </div>
        ) : lines.length === 0 ? (
          <section className="rounded-[1.5rem] border border-[#B9C5BE] bg-[#F7F5F0] px-6 py-14 text-center shadow-[0_8px_20px_rgba(24,48,40,0.07)] sm:py-16">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DFE8E2] text-[#0F5A46]">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-[#17251F]">
              Your cart is empty
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#68756E]">
              Browse the catalog and add products before continuing to checkout.
            </p>
            {cartError && <p className="mt-3 text-sm font-semibold text-[#A13D32]">{cartError}</p>}
            <a
              href="/catalog"
              className="mx-auto mt-6 flex h-12 w-fit items-center justify-center rounded-xl bg-[#0F5A46] px-6 text-sm font-bold text-white transition-colors hover:bg-[#126B54]"
            >
              Continue Shopping
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="space-y-4">
              {cartError && (
                <p role="alert" className="rounded-xl border border-[#D9AAA4] bg-[#FFF3F1] px-4 py-3 text-sm font-semibold text-[#8E342B]">
                  {cartError}
                </p>
              )}
              {lines.map((item: any, index: number) => (
                <CartLine
                  key={item.node.id}
                  item={item}
                  priority={index < 2}
                  updating={updatingLineIds.has(item.node.id)}
                  onIncrease={increaseQuantity}
                  onDecrease={decreaseQuantity}
                  onRemove={removeItem}
                />
              ))}
            </section>

            <aside className="h-fit rounded-[1.5rem] border border-[#AEBBB4] bg-[#F7F5F0] p-6 shadow-[0_8px_20px_rgba(24,48,40,0.08)] lg:sticky lg:top-28">
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#0F5A46]">
                Order Summary
              </p>
              <div className="mt-4 flex items-end justify-between border-b border-[#D4D9D4] pb-5">
                <span className="text-sm font-semibold text-[#68756E]">Subtotal</span>
                <span className="text-2xl font-extrabold text-[#17251F]">
                  ${Number(cart?.cost?.subtotalAmount?.amount || 0).toFixed(2)}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#68756E]">
                Shipping, taxes, and discounts are calculated at checkout.
              </p>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={updatingLineIds.size > 0}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#0F5A46] px-5 text-sm font-bold text-white transition-colors hover:bg-[#126B54] disabled:cursor-wait disabled:opacity-60"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <a href="/catalog" className="mt-4 block text-center text-sm font-bold text-[#0F5A46] hover:underline">
                Continue Shopping
              </a>
              <div className="mt-6 space-y-3 border-t border-[#D4D9D4] pt-5 text-sm font-semibold text-[#52635A]">
                <p className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-[#A98532]" />Secure checkout</p>
                <p className="flex items-center gap-3"><Truck className="h-4 w-4 text-[#A98532]" />Tracked shipping</p>
                <p className="flex items-center gap-3"><PackageCheck className="h-4 w-4 text-[#A98532]" />Careful packaging</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}