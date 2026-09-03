import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  LogIn,
  ShoppingBag,
  Trash2,
} from 'lucide-react';

const itemsPerPage = 12;
const shopifyAuthLoginUrl = 'https://www.ildistributions.com/api/auth/login';

async function readJsonResponse(response: Response) {
  const responseText = await response.text();
  if (!responseText.trim()) return null;

  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
}

function getOptimizedImageUrl(url?: string) {
  if (!url) return '';
  try {
    const nextUrl = new URL(url);
    if (nextUrl.hostname.includes('cdn.shopify.com')) {
      nextUrl.searchParams.set('width', '520');
    }
    return nextUrl.toString();
  } catch {
    return url;
  }
}

const WishlistCard = memo(function WishlistCard({
  item,
  priority,
  removing,
  onRemove,
}: {
  item: any;
  priority: boolean;
  removing: boolean;
  onRemove: (productId: string) => void;
}) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-[#B9C5BE] bg-[#F7F5F0] shadow-[0_8px_20px_rgba(24,48,40,0.07)] [content-visibility:auto] [contain-intrinsic-size:420px]">
      <a
        href={`/product/${item.handle}`}
        className="flex h-64 items-center justify-center border-b border-[#D6DDD8] bg-white p-5"
      >
        {item.image_url ? (
          <img
            src={getOptimizedImageUrl(item.image_url)}
            alt={item.title}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            width="520"
            height="520"
            className="h-full w-full object-contain"
          />
        ) : (
          <Heart className="h-10 w-10 text-[#B7923E]" />
        )}
      </a>

      <div className="p-5">
        <a href={`/product/${item.handle}`}>
          <h2 className="line-clamp-2 min-h-[48px] text-base font-extrabold leading-snug text-[#17251F] transition-colors hover:text-[#0F5A46]">
            {item.title}
          </h2>
        </a>

        {item.price !== null && item.price !== undefined && item.price !== '' && (
          <p className="mt-3 text-xl font-extrabold text-[#0F5A46]">
            ${Number(item.price).toFixed(2)}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <a
            href={`/product/${item.handle}`}
            className="flex h-11 items-center justify-center rounded-xl bg-[#0F5A46] px-4 text-sm font-bold text-white transition-colors hover:bg-[#126B54]"
          >
            View Product
          </a>
          <button
            type="button"
            disabled={removing}
            onClick={() => onRemove(item.product_id)}
            className="flex h-11 items-center justify-center rounded-xl border border-[#E4BDB8] bg-[#FFF8F7] px-4 text-sm font-bold text-[#A13D32] transition-colors hover:bg-[#A13D32] hover:text-white disabled:cursor-wait disabled:opacity-45"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {removing ? 'Removing' : 'Remove'}
          </button>
        </div>
      </div>
    </article>
  );
});

export function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(() => new Set());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWishlist() {
      setLoading(true);
      setError('');
      setRequiresLogin(false);

      try {
        const customerResponse = await fetch('/api/customer/me', {
          signal: controller.signal,
          headers: {Accept: 'application/json'},
        });
        const customerData = await readJsonResponse(customerResponse);

        if (controller.signal.aborted) return;

        const isSignedOut =
          customerResponse.status === 401 ||
          customerResponse.status === 403 ||
          (customerResponse.ok && customerData?.isLoggedIn !== true);

        if (isSignedOut) {
          setItems([]);
          setRequiresLogin(true);
          return;
        }

        if (!customerResponse.ok || !customerData) {
          throw new Error('Customer session request failed');
        }

        const response = await fetch('/api/wishlist/list', {
          signal: controller.signal,
          headers: {Accept: 'application/json'},
        });

        if (response.status === 401 || response.status === 403) {
          setItems([]);
          setRequiresLogin(true);
          return;
        }

        const data = await readJsonResponse(response);
        if (!response.ok || !data?.success) {
          throw new Error('Wishlist request failed');
        }

        if (!controller.signal.aborted) {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch {
        if (!controller.signal.aborted) {
          setItems([]);
          setError('Your wishlist could not be loaded. Please refresh the page.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadWishlist();
    return () => controller.abort();
  }, []);

  const removeItem = useCallback(async (productId: string) => {
    setError('');
    setRequiresLogin(false);
    setRemovingIds((current) => new Set(current).add(productId));

    try {
      const response = await fetch('/api/wishlist/remove', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({product_id: productId}),
      });

      if (response.status === 401 || response.status === 403) {
        setItems([]);
        setRequiresLogin(true);
        return;
      }

      const data = await readJsonResponse(response);
      if (!response.ok || !data?.success) {
        throw new Error('Wishlist removal failed');
      }
      setItems((current) =>
        current.filter((item) => item.product_id !== productId)
      );
    } catch {
      setError('The product could not be removed. Please try again.');
    } finally {
      setRemovingIds((current) => {
        const next = new Set(current);
        next.delete(productId);
        return next;
      });
    }
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, safeCurrentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    window.requestAnimationFrame(() => {
      document
        .getElementById('wishlist-products')
        ?.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
  }

  return (
    <main className="min-h-screen bg-[#CDD6CF] px-4 py-8 sm:px-6 md:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-col justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-[#123F34] px-6 py-7 sm:flex-row sm:items-end sm:px-8">
          <div>
            <div className="flex items-center gap-2 text-[#D8BE6B]">
              <Heart className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-[0.14em]">
                Saved Products
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] text-white sm:text-4xl">
              My wishlist
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#C5D0CB]">
              Keep products connected to your customer account and return to
              them whenever you are ready.
            </p>
          </div>
          {!loading && !requiresLogin && items.length > 0 && (
            <p className="text-sm font-semibold text-[#C5D0CB]">
              {items.length} {items.length === 1 ? 'product' : 'products'}
            </p>
          )}
        </header>

        {loading ? (
          <div className="rounded-[1.5rem] border border-[#B9C5BE] bg-[#E2E7E3] p-10 text-center text-sm font-semibold text-[#68756E]">
            Loading wishlist...
          </div>
        ) : requiresLogin ? (
          <section className="rounded-[1.5rem] border border-[#B9C5BE] bg-[#F7F5F0] px-6 py-14 text-center shadow-[0_8px_20px_rgba(24,48,40,0.07)] sm:py-16">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2E8CA] text-[#8A6A24]">
              <LogIn className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-[#17251F]">
              Sign in to use your wishlist
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#68756E]">
              Your saved products are connected to your Shopify customer
              account. Sign in or create an account to view and manage them.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={shopifyAuthLoginUrl}
                className="flex h-12 items-center justify-center rounded-xl bg-[#0F5A46] px-6 text-sm font-bold text-white transition-colors hover:bg-[#126B54]"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In or Create Account
              </a>
              <a
                href="/catalog"
                className="flex h-12 items-center justify-center rounded-xl border border-[#AAB9B1] bg-white px-6 text-sm font-bold text-[#17251F] transition-colors hover:border-[#0F5A46] hover:text-[#0F5A46]"
              >
                Continue Shopping
              </a>
            </div>
          </section>
        ) : items.length === 0 ? (
          <section className="rounded-[1.5rem] border border-[#B9C5BE] bg-[#F7F5F0] px-6 py-14 text-center shadow-[0_8px_20px_rgba(24,48,40,0.07)] sm:py-16">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DFE8E2] text-[#0F5A46]">
              <Heart className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-[#17251F]">
              {error ? 'Wishlist unavailable' : 'Your wishlist is empty'}
            </h2>
            <p className={`mx-auto mt-2 max-w-md text-sm leading-relaxed ${error ? 'font-semibold text-[#A13D32]' : 'text-[#68756E]'}`}>
              {error || 'Save products you like and come back to them anytime.'}
            </p>
            <a
              href="/catalog"
              className="mx-auto mt-6 flex h-12 w-fit items-center justify-center rounded-xl bg-[#0F5A46] px-6 text-sm font-bold text-white transition-colors hover:bg-[#126B54]"
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Browse Products
            </a>
          </section>
        ) : (
          <section id="wishlist-products" className="scroll-mt-24">
            {error && (
              <p role="alert" className="mb-4 rounded-xl border border-[#D9AAA4] bg-[#FFF3F1] px-4 py-3 text-sm font-semibold text-[#8E342B]">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item, index) => (
                <WishlistCard
                  key={item.id || item.product_id}
                  item={item}
                  priority={safeCurrentPage === 1 && index < 3}
                  removing={removingIds.has(item.product_id)}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Wishlist pages" className="mt-7 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => goToPage(safeCurrentPage - 1)}
                  className="flex h-10 items-center gap-2 rounded-full border border-[#AAB9B1] bg-[#F7F5F0] px-4 text-sm font-bold text-[#17251F] transition-colors hover:border-[#0F5A46] disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
                <span className="px-3 text-sm font-semibold text-[#52635A]">
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => goToPage(safeCurrentPage + 1)}
                  className="flex h-10 items-center gap-2 rounded-full border border-[#AAB9B1] bg-[#F7F5F0] px-4 text-sm font-bold text-[#17251F] transition-colors hover:border-[#0F5A46] disabled:opacity-40"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </section>
        )}
      </div>
    </main>
  );
}