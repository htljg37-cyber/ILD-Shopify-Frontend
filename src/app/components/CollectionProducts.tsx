import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import {
  getProductsByCollection,
  createCart,
  addToCart,
} from '../../lib/shopify';

export function CollectionProducts({ handle }: { handle: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [addingId, setAddingId] = useState<string>('');

  useEffect(() => {
    async function loadProducts() {
      const data = await getProductsByCollection(handle);
      setProducts(data.products);
    }

    loadProducts();
  }, [handle]);

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
  }

  if (products.length === 0) {
    return (
      <section className="container mx-auto px-6 py-16">
        <p className="text-[#717182]">
          No products found in this collection yet.
        </p>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-6 py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product) => {
          const isOutOfStock =
            product?.isOutOfStock || !product?.availableForSale;

          return (
            <a
              href={`/product/${product.handle}`}
              key={product.id}
              className={`block bg-white rounded-2xl overflow-hidden shadow-sm transition-all ${
                isOutOfStock
                  ? 'opacity-80'
                  : 'hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              <div className="relative h-72 bg-[#F5F5F5] overflow-hidden">
                {product.featuredImage?.url ? (
                  <img
                    src={product.featuredImage.url}
                    alt={product.title}
                    className={`w-full h-full object-contain p-4 transition-all duration-300 ${
                      isOutOfStock ? 'grayscale opacity-70' : ''
                    }`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#717182]">
                    No image
                  </div>
                )}

                {isOutOfStock && (
                  <div className="absolute top-4 left-4 right-4 rounded-full bg-[#111111] px-4 py-2 text-center text-xs font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
                    Out of Stock
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
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

                <h3 className="text-lg font-semibold text-[#111111] mb-3 line-clamp-2">
                  {product.title}
                </h3>

                <p className="text-2xl font-bold text-[#111111] mb-4">
                  ${product.priceRange?.minVariantPrice?.amount}
                </p>

                <Button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleQuickAdd(product);
                  }}
                  disabled={addingId === product.id || isOutOfStock}
                  className={`w-full text-white ${
                    isOutOfStock
                      ? 'cursor-not-allowed bg-[#717182] hover:bg-[#717182]'
                      : 'bg-[#0F5A46] hover:bg-[#0F5A46]/90'
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
            </a>
          );
        })}
      </div>
    </section>
  );
}