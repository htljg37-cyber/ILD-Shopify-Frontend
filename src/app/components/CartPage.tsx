import { useEffect, useState } from 'react';
import {
  Trash2,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Truck,
  PackageCheck,
} from 'lucide-react';
import { Button } from './ui/button';
import { getCart, updateCartLine, removeCartLine } from '../../lib/shopify';

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadCart() {
    const cartId = localStorage.getItem('shopify_cart_id');

    if (!cartId) {
      setLoading(false);
      return;
    }

    const data = await getCart(cartId);
    setCart(data);

    localStorage.setItem(
      'shopify_cart_quantity',
      String(data?.totalQuantity || 0)
    );
    window.dispatchEvent(new Event('cartUpdated'));

    setLoading(false);
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function increaseQuantity(lineId: string, quantity: number) {
    const cartId = localStorage.getItem('shopify_cart_id');
    if (!cartId) return;

    const updatedCart = await updateCartLine(cartId, lineId, quantity + 1);
    setCart(updatedCart);

    localStorage.setItem(
      'shopify_cart_quantity',
      String(updatedCart?.totalQuantity || 0)
    );
    window.dispatchEvent(new Event('cartUpdated'));
  }

  async function decreaseQuantity(lineId: string, quantity: number) {
    const cartId = localStorage.getItem('shopify_cart_id');
    if (!cartId) return;

    if (quantity <= 1) {
      await removeItem(lineId);
      return;
    }

    const updatedCart = await updateCartLine(cartId, lineId, quantity - 1);
    setCart(updatedCart);

    localStorage.setItem(
      'shopify_cart_quantity',
      String(updatedCart?.totalQuantity || 0)
    );
    window.dispatchEvent(new Event('cartUpdated'));
  }

  async function removeItem(lineId: string) {
    const cartId = localStorage.getItem('shopify_cart_id');
    if (!cartId) return;

    const updatedCart = await removeCartLine(cartId, lineId);
    setCart(updatedCart);

    localStorage.setItem(
      'shopify_cart_quantity',
      String(updatedCart?.totalQuantity || 0)
    );
    window.dispatchEvent(new Event('cartUpdated'));
  }

  function handleCheckout() {
    if (!cart?.checkoutUrl) {
      alert(
        'Checkout is not available yet. Please refresh your cart and try again.'
      );
      return;
    }

    try {
      const checkoutUrl = new URL(cart.checkoutUrl);
      checkoutUrl.hostname = 'il-distributions-llc.myshopify.com';

      window.location.href = checkoutUrl.toString();
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Unable to open checkout. Please try again.');
    }
  }

  if (loading) {
    return (
      <section className="relative min-h-[500px] bg-[linear-gradient(180deg,#FAFAFA_0%,#F6F4EF_100%)] px-4 py-20">
        <div className="container mx-auto">
          <div className="rounded-3xl border border-[#EAE7DF] bg-white/85 p-10 text-center shadow-sm">
            <p className="text-[#717182]">Loading cart...</p>
          </div>
        </div>
      </section>
    );
  }

  const lines = cart?.lines?.edges || [];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_10%,rgba(15,90,70,0.07),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(200,164,93,0.10),transparent_28%),linear-gradient(180deg,#FAFAFA_0%,#F6F4EF_100%)]">
      <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <section className="container relative z-10 mx-auto px-4 py-10 md:px-6 md:py-16">
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white/75 px-4 py-2 shadow-sm">
            <ShoppingCart className="h-4 w-4 text-[#C8A45D]" />
            <span className="text-sm font-semibold text-[#0F5A46]">
              Shopping Cart
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-[#111111] md:text-5xl">
            Review Your Cart
          </h1>
        </div>

        {lines.length === 0 ? (
          <div className="rounded-[2rem] border border-[#EAE7DF] bg-white/85 p-8 text-center shadow-[0_18px_55px_rgba(17,17,17,0.06)] backdrop-blur-sm md:p-12">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F5A46]/10 text-[#0F5A46]">
              <ShoppingCart className="h-8 w-8" />
            </div>

            <h2 className="mb-3 text-2xl font-extrabold text-[#111111]">
              Your cart is empty
            </h2>

            <p className="mx-auto max-w-md text-[#717182]">
              Explore our curated catalog and add your favorite products before
              checkout.
            </p>

            <a href="/catalog">
              <Button className="mt-7 rounded-2xl bg-[#0F5A46] px-8 py-6 text-white shadow-[0_12px_30px_rgba(15,90,70,0.28)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#126B54]">
                Continue Shopping
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-3 lg:gap-10">
            <div className="space-y-5 lg:col-span-2">
              {lines.map((item: any) => {
                const product = item.node.merchandise.product;
                const price =
                  item.node.cost?.totalAmount?.amount ||
                  item.node.merchandise?.price?.amount ||
                  '0.00';

                return (
                  <div
                    key={item.node.id}
                    className="group rounded-[2rem] border border-[#EAE7DF] bg-white/85 p-4 shadow-[0_10px_30px_rgba(17,17,17,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,90,70,0.10)] md:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row md:gap-6">
                      <a href={`/product/${product.handle}`} className="block">
                        <div className="overflow-hidden rounded-2xl bg-[#F8F7F3] p-3">
                          <img
                            src={product.featuredImage?.url}
                            alt={product.title}
                            className="h-40 w-full object-contain transition-transform duration-500 group-hover:scale-105 sm:h-32 sm:w-32"
                          />
                        </div>
                      </a>

                      <div className="flex-1">
                        <a href={`/product/${product.handle}`}>
                          <h2 className="mb-2 text-base font-bold leading-snug text-[#111111] transition-colors duration-300 hover:text-[#0F5A46] md:text-xl">
                            {product.title}
                          </h2>
                        </a>

                        <p className="mb-4 text-2xl font-extrabold text-[#111111]">
                          ${price}
                        </p>

                        <div className="flex items-center justify-between gap-3 sm:justify-start">
                          <div className="flex items-center gap-3 rounded-2xl border border-[#EAE7DF] bg-[#F8F7F3] p-1">
                            <button
                              onClick={() =>
                                decreaseQuantity(
                                  item.node.id,
                                  item.node.quantity
                                )
                              }
                              className="h-10 w-10 rounded-xl bg-white font-bold text-[#111111] shadow-sm transition-all duration-300 hover:bg-[#0F5A46] hover:text-white"
                            >
                              -
                            </button>

                            <span className="min-w-8 text-center text-lg font-bold">
                              {item.node.quantity}
                            </span>

                            <button
                              onClick={() =>
                                increaseQuantity(
                                  item.node.id,
                                  item.node.quantity
                                )
                              }
                              className="h-10 w-10 rounded-xl bg-white font-bold text-[#111111] shadow-sm transition-all duration-300 hover:bg-[#0F5A46] hover:text-white"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.node.id)}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-500 hover:text-white hover:shadow-[0_12px_30px_rgba(239,68,68,0.20)]"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="h-fit rounded-[2rem] border border-[#EAE7DF] bg-white/90 p-6 shadow-[0_18px_55px_rgba(17,17,17,0.06)] backdrop-blur-sm lg:sticky lg:top-28 md:p-8">
              <h2 className="mb-6 text-2xl font-extrabold text-[#111111]">
                Order Summary
              </h2>

              <div className="mb-5 rounded-2xl bg-[#F8F7F3] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-semibold text-[#717182]">Subtotal</span>

                  <span className="text-2xl font-extrabold text-[#111111]">
                    ${cart?.cost?.subtotalAmount?.amount || '0.00'}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-[#717182]">
                  Shipping, taxes, and discounts are calculated at checkout.
                </p>
              </div>

              <Button
                onClick={handleCheckout}
                className="h-14 w-full rounded-2xl bg-[#0F5A46] text-base text-white shadow-[0_12px_30px_rgba(15,90,70,0.28)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#126B54] hover:shadow-[0_18px_42px_rgba(15,90,70,0.38)] active:translate-y-0 active:scale-[0.98]"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <a
                href="/catalog"
                className="mt-5 block text-center text-sm font-bold text-[#0F5A46] transition-all duration-300 hover:translate-x-1"
              >
                Continue Shopping →
              </a>

              <div className="mt-7 grid gap-3">
                {[
                  [ShieldCheck, 'Secure checkout'],
                  [Truck, 'Tracked shipping'],
                  [PackageCheck, 'Careful packaging'],
                ].map(([Icon, label]) => (
                  <div
                    key={label as string}
                    className="flex items-center gap-3 rounded-2xl border border-[#EAE7DF] bg-white px-4 py-3 text-sm font-semibold text-[#111111]"
                  >
                    <Icon className="h-4 w-4 text-[#C8A45D]" />
                    {label as string}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}