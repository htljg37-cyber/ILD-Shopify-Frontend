import { useEffect, useState } from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

export function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadWishlist() {
    setLoading(true);

    try {
      const response = await fetch('/api/wishlist/list');
      const data = await response.json();

      if (data?.success) {
        setItems(data.items || []);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(productId: string) {
    const response = await fetch('/api/wishlist/remove', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_id: productId }),
    });

    const data = await response.json();

    if (data?.success) {
      setItems((current) =>
        current.filter((item) => item.product_id !== productId)
      );
    }
  }

  useEffect(() => {
    loadWishlist();
  }, []);

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#FAFAFA_0%,#F6F4EF_100%)] py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0F5A46]/10">
            <Heart className="h-8 w-8 text-[#0F5A46]" />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-[#111111]">
            My Wishlist
          </h1>

          <p className="mt-3 text-[#717182]">
            Your saved products are connected to your Shopify customer account.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-[#EAE7DF] bg-white p-10 text-center text-[#717182]">
            Loading wishlist...
          </div>
        ) : items.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-[#EAE7DF] bg-white p-10 text-center shadow-sm">
            <Heart className="mx-auto mb-4 h-10 w-10 text-[#C8A45D]" />

            <h2 className="text-2xl font-bold text-[#111111]">
              Your wishlist is empty
            </h2>

            <p className="mt-3 text-[#717182]">
              Save products you like and come back to them anytime.
            </p>

            <a href="/catalog" className="mt-6 inline-block">
              <Button className="bg-[#0F5A46] text-white hover:bg-[#0F5A46]/90">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Browse Products
              </Button>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-3xl border border-[#EAE7DF] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,90,70,0.12)]"
              >
                <a href={`/product/${item.handle}`}>
                  <div className="flex h-72 items-center justify-center bg-[#F8F7F3] p-6">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Heart className="h-10 w-10 text-[#C8A45D]" />
                    )}
                  </div>
                </a>

                <div className="p-5">
                  <a href={`/product/${item.handle}`}>
                    <h3 className="line-clamp-2 text-lg font-bold text-[#111111] hover:text-[#0F5A46]">
                      {item.title}
                    </h3>
                  </a>

                  {item.price && (
                    <p className="mt-3 text-xl font-extrabold text-[#0F5A46]">
                      ${Number(item.price).toFixed(2)}
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <a href={`/product/${item.handle}`}>
                      <Button className="w-full bg-[#0F5A46] text-white hover:bg-[#0F5A46]/90">
                        View
                      </Button>
                    </a>

                    <Button
                      variant="outline"
                      onClick={() => removeItem(item.product_id)}
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}