import { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Truck,
  ShieldCheck,
  PackageCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  getProductByHandle,
  createCart,
  addToCart,
} from '../../lib/shopify';

export function ProductPage({ handle }: { handle: string }) {
  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [addedMessage, setAddedMessage] = useState('');

  useEffect(() => {
    async function loadProduct() {
      const data = await getProductByHandle(handle);
      setProduct(data);

      const firstImage =
        data?.images?.edges?.[0]?.node?.url || data?.featuredImage?.url || '';

      setSelectedImage(firstImage);
    }

    loadProduct();
  }, [handle]);

  async function handleAddToCart() {
    if (!product) return;

    const variantId = product.variants?.edges?.[0]?.node?.id;

    if (!variantId) {
      alert('This product does not have an available variant.');
      return;
    }

    setAdding(true);
    setAddedMessage('');

    try {
      let cartId = localStorage.getItem('shopify_cart_id');

      if (!cartId) {
        const newCart = await createCart(variantId, 1);

        if (!newCart) {
          alert('Unable to create cart.');
          setAdding(false);
          return;
        }

        localStorage.setItem('shopify_cart_id', newCart.id);
        localStorage.setItem(
          'shopify_cart_quantity',
          String(newCart.totalQuantity || 1)
        );
      } else {
        const updatedCart = await addToCart(cartId, variantId, 1);

        if (!updatedCart) {
          alert('Unable to add to cart.');
          setAdding(false);
          return;
        }

        localStorage.setItem(
          'shopify_cart_quantity',
          String(updatedCart.totalQuantity || 1)
        );
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

    const variantId = product.variants?.edges?.[0]?.node?.id;

    if (!variantId) {
      alert('No variant found.');
      return;
    }

    setBuying(true);

    const cart = await createCart(variantId, 1);

    setBuying(false);

    if (cart?.checkoutUrl) {
      window.location.href = cart.checkoutUrl;
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
  const price = product.priceRange?.minVariantPrice?.amount;

  return (
    <main className="relative overflow-hidden bg-[radial-gradient(circle_at_10%_10%,rgba(15,90,70,0.07),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(200,164,93,0.10),transparent_28%),linear-gradient(180deg,#FAFAFA_0%,#F6F4EF_100%)]">
      <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <section className="container relative z-10 mx-auto px-4 py-10 md:px-6 md:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="group relative overflow-hidden rounded-[2rem] border border-[#EAE7DF] bg-white/85 p-4 shadow-[0_18px_55px_rgba(17,17,17,0.06)] backdrop-blur-sm md:p-8">
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_0%,rgba(200,164,93,0.14),transparent_38%)]" />

              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.title}
                  className="relative z-10 h-[320px] w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.04] sm:h-[430px] lg:h-[560px]"
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
                      className="h-20 w-full object-contain transition-transform duration-300 group-hover:scale-105 md:h-24"
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

              <h1 className="mb-5 text-3xl font-extrabold leading-tight tracking-tight text-[#111111] sm:text-4xl md:text-5xl">
                {product.title}
              </h1>

              <div className="mb-6 flex flex-wrap items-center gap-3">
                <p className="text-3xl font-extrabold text-[#111111] md:text-4xl">
                  ${price}
                </p>

                <span className="rounded-full bg-[#C8A45D]/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#8A6A24]">
                  Premium Pick
                </span>
              </div>

              <div
                className="prose prose-sm max-w-none text-[#717182] prose-p:leading-relaxed prose-strong:text-[#111111] mb-8"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />

              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="h-14 rounded-2xl bg-[#0F5A46] px-8 text-base text-white shadow-[0_12px_30px_rgba(15,90,70,0.28)] transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-[#126B54] hover:shadow-[0_18px_42px_rgba(15,90,70,0.38)] active:translate-y-0 active:scale-[0.98]"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {adding ? 'Adding...' : 'Add to Cart'}
                </Button>

                <Button
                  onClick={handleBuyNow}
                  disabled={buying}
                  variant="outline"
                  className="h-14 rounded-2xl border-[#0F5A46] bg-white text-base text-[#0F5A46] transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-[#0F5A46] hover:text-white hover:shadow-[0_18px_42px_rgba(15,90,70,0.18)] active:translate-y-0 active:scale-[0.98]"
                >
                  {buying ? 'Opening checkout...' : 'Buy Now'}
                  <ArrowRight className="ml-2 h-5 w-5" />
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
                    <Icon className="mb-3 h-6 w-6 text-[#0F5A46] transition-transform duration-300 group-hover:scale-110" />
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
    </main>
  );
}