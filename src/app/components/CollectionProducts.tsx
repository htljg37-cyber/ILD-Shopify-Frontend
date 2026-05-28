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
    const variantId = product.variants?.edges?.[0]?.node?.id;

    if (!variantId) {
      alert('This product does not have an available variant.');
      return;
    }

    setAddingId(product.id);

    try {
      let cartId = localStorage.getItem('shopify_cart_id');

      if (!cartId) {
        const newCart = await createCart(variantId, 1);

        if (!newCart) {
          alert('Unable to create cart.');
          setAddingId('');
          return;
        }

        localStorage.setItem('shopify_cart_id', newCart.id);
        localStorage.setItem('shopify_cart_quantity', String(newCart.totalQuantity || 1));
      } else {
        const updatedCart = await addToCart(cartId, variantId, 1);

        if (!updatedCart) {
          alert('Unable to add to cart.');
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

  if (products.length === 0) {
    return (
      <section className="container mx-auto px-6 py-16">
        <p className="text-[#717182]">No products found in this collection yet.</p>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-6 py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <a
            href={`/product/${product.handle}`}
            key={product.id}
            className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
          >
            <div className="relative h-72 bg-[#F5F5F5] overflow-hidden">
              <img
                src={product.featuredImage?.url}
                alt={product.title}
                className="w-full h-full object-contain p-4"
              />
            </div>

            <div className="p-5">
              <h3 className="text-lg font-semibold text-[#111111] mb-3">
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
                disabled={addingId === product.id}
                className="w-full bg-[#0F5A46] hover:bg-[#0F5A46]/90 text-white"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {addingId === product.id ? 'Adding...' : 'Quick Add'}
              </Button>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}