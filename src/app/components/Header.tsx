import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  User,
  ShoppingCart,
  Menu,
  X,
  Heart,
  Package,
  LogOut,
} from 'lucide-react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { getProducts } from '../../lib/shopify';

function normalizeText(text: string) {
  return text.toLowerCase().replaceAll('_', ' ').trim();
}

function formatTag(tag: string) {
  return tag
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const navItems = [
  ['Home', '/'],
  ['Catalog', '/catalog'],
  ['New Arrivals', '/new-arrivals'],
  ['Collections', '/collections'],
  ['Brands', '/brands'],
  ['Track Order', '/track-order'],
  ['Contact', '/contact'],
];

const accountPath = 'https://account.ildistributions.com/profile';

const navLinkClass =
  'relative px-1 py-2 text-[15px] font-semibold tracking-[0.01em] text-[#111111]/90 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:text-[#0F5A46] after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:rounded-full after:bg-gradient-to-r after:from-[#0F5A46] after:to-[#C8A45D] after:transition-all after:duration-300 hover:after:w-full';

const iconButtonClass =
  'relative hidden md:flex transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.04] hover:bg-[#F5F5F5] hover:text-[#0F5A46] hover:shadow-[0_10px_24px_rgba(15,90,70,0.12)] active:translate-y-0 active:scale-[0.96]';

function SearchBox({
  mobile = false,
  searchTerm,
  setSearchTerm,
  searchResults,
  setMobileMenuOpen,
}: {
  mobile?: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  searchResults: any[];
  setMobileMenuOpen: (value: boolean) => void;
}) {
  return (
    <div className="relative w-full group">
      <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-xl px-4 py-3 transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:bg-white group-hover:shadow-[0_12px_30px_rgba(15,90,70,0.12)] group-hover:ring-1 group-hover:ring-[#0F5A46]/15 focus-within:bg-white focus-within:shadow-[0_12px_30px_rgba(15,90,70,0.16)] focus-within:ring-1 focus-within:ring-[#0F5A46]/25">
        <Search className="h-4 w-4 text-[#717182] transition-all duration-300 group-hover:text-[#0F5A46] group-hover:scale-110" />

        <Input
          type="search"
          value={searchTerm}
          autoComplete="off"
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchTerm.trim()) {
              window.location.href = `/catalog?search=${encodeURIComponent(
                searchTerm.trim()
              )}`;
            }
          }}
          placeholder="Search products..."
          className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-[#111111]"
        />
      </div>

      {searchTerm.trim() && (
        <div
          className={`${
            mobile ? 'relative mt-3' : 'absolute right-0 top-14'
          } z-[9999] w-full md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden`}
        >
          {searchResults.length > 0 ? (
            <>
              {searchResults.map((product) => (
                <a
                  key={product.id}
                  href={`/product/${product.handle}`}
                  onClick={() => {
                    setSearchTerm('');
                    setMobileMenuOpen(false);
                  }}
                  className="flex gap-3 p-4 hover:bg-[#F5F5F5] transition-colors"
                >
                  <img
                    src={product.featuredImage?.url}
                    alt={product.title}
                    className="w-14 h-14 rounded-xl object-cover bg-[#F5F5F5]"
                  />

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#111111] line-clamp-2">
                      {product.title}
                    </p>

                    <p className="text-sm font-bold text-[#0F5A46] mt-1">
                      ${product.priceRange?.minVariantPrice?.amount}
                    </p>

                    {product.tags?.[0] && (
                      <p className="text-xs text-[#717182] mt-1">
                        {formatTag(product.tags[0])}
                      </p>
                    )}
                  </div>
                </a>
              ))}

              <a
                href={`/catalog?search=${encodeURIComponent(searchTerm)}`}
                onClick={() => {
                  setSearchTerm('');
                  setMobileMenuOpen(false);
                }}
                className="block text-center text-sm font-semibold text-[#0F5A46] p-4 border-t"
              >
                View all results
              </a>
            </>
          ) : (
            <div className="p-5">
              <p className="text-sm font-semibold text-[#111111]">
                No exact results found.
              </p>

              <p className="text-sm text-[#717182] mt-1">
                Try searching by brand, category, scale, color, or product type.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [cartQuantity, setCartQuantity] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    function updateCartQuantity() {
      const quantity = localStorage.getItem('shopify_cart_quantity');
      setCartQuantity(quantity ? Number(quantity) : 0);
    }

    updateCartQuantity();
    window.addEventListener('cartUpdated', updateCartQuantity);

    return () => {
      window.removeEventListener('cartUpdated', updateCartQuantity);
    };
  }, []);

  useEffect(() => {
    async function loadProducts() {
      const data = await getProducts();
      setProducts(data);
    }

    loadProducts();
  }, []);

  useEffect(() => {
  async function loadCustomer() {
    try {
      const response = await fetch('/api/customer/me');
      const data = await response.json();

      if (data?.isLoggedIn && data?.customer) {
        setCustomer(data.customer);
      } else {
        setCustomer(null);
      }
    } catch {
      setCustomer(null);
    }
  }

  loadCustomer();
}, []);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const query = normalizeText(searchTerm);

    return products
      .map((product) => {
        const title = normalizeText(product.title || '');
        const tags = (product.tags || []).map((tag: string) =>
          normalizeText(tag)
        );
        const tagText = tags.join(' ');

        let score = 0;

        if (title.includes(query)) score += 10;
        if (tagText.includes(query)) score += 6;

        query.split(' ').forEach((word) => {
          if (!word) return;
          if (title.includes(word)) score += 3;
          if (tagText.includes(word)) score += 2;
        });

        return { product, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.product);
  }, [products, searchTerm]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(17,17,17,0.06)] transition-all duration-300">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6 transition-all duration-300">
          <div className="flex items-center gap-5 lg:gap-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#F5F5F5] hover:text-[#0F5A46]"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6 text-[#111111]" />
            </Button>

            <a
              href="/"
              className="group flex items-center flex-shrink-0 transition-all duration-300 ease-out hover:-translate-y-0.5"
            >
              <img
                src="/logo.png"
                alt="IL Distributions LLC"
                className="h-10 sm:h-12 lg:h-14 w-auto max-w-[230px] object-contain transition-all duration-300 ease-out group-hover:scale-[1.04] group-hover:drop-shadow-[0_8px_18px_rgba(15,90,70,0.22)]"
              />
            </a>

            <nav className="hidden lg:flex items-center gap-7">
              {navItems.map(([label, href]) => (
                <a key={href} href={href} className={navLinkClass}>
                  {label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:block w-64">
              <SearchBox
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                searchResults={searchResults}
                setMobileMenuOpen={setMobileMenuOpen}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-[#F5F5F5] md:hidden transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.04] hover:text-[#0F5A46]"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Search className="h-5 w-5 text-[#111111]" />
            </Button>

            <div className="relative hidden md:block">
  <Button
    variant="ghost"
    size="icon"
    className={iconButtonClass}
    onClick={() => {
      if (!customer) {
        window.location.href = '/account';
        return;
      }

      setAccountMenuOpen((value) => !value);
    }}
  >
    <User className="h-5 w-5 transition-all duration-300" />

    {customer && (
      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#0F5A46]" />
    )}
  </Button>

  {accountMenuOpen && customer && (
    <div className="absolute right-0 top-12 z-[9999] w-64 overflow-hidden rounded-2xl border border-[#EAE7DF] bg-white shadow-2xl">
      <div className="border-b border-[#EAE7DF] p-4">
        <p className="text-sm font-bold text-[#111111]">
          {customer.firstName || 'Customer'}
        </p>
        <p className="mt-1 truncate text-xs text-[#717182]">
          {customer.emailAddress?.emailAddress}
        </p>
      </div>

      <a
        href="https://account.ildistributions.com/profile"
        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-[#F5F5F5] hover:text-[#0F5A46]"
      >
        <User className="h-4 w-4" />
        Profile
      </a>

      <a
        href="/wishlist"
        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-[#F5F5F5] hover:text-[#0F5A46]"
      >
        <Heart className="h-4 w-4" />
        Wishlist
      </a>

      <a
        href="/track-order"
        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-[#F5F5F5] hover:text-[#0F5A46]"
      >
        <Package className="h-4 w-4" />
        Orders
      </a>

      <a
        href="/api/auth/logout"
        className="flex items-center gap-3 border-t border-[#EAE7DF] px-4 py-3 text-sm font-semibold text-[#c00000] hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </a>
    </div>
  )}
</div>

            <a href="/cart" aria-label="Cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.04] hover:bg-[#F5F5F5] hover:text-[#0F5A46] hover:shadow-[0_10px_24px_rgba(15,90,70,0.12)] active:translate-y-0 active:scale-[0.96]"
              >
                <ShoppingCart className="h-5 w-5 text-[#111111] transition-all duration-300" />

                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#0F5A46] text-white text-xs flex items-center justify-center shadow-[0_4px_12px_rgba(15,90,70,0.35)]">
                  {cartQuantity}
                </span>
              </Button>
            </a>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu-wrapper"
            className="fixed inset-0 z-[9999] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="absolute inset-0 bg-black/65 backdrop-blur-[3px]"
              onClick={() => setMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            />

            <motion.aside
              className="relative z-[10000] h-screen w-[86%] max-w-sm overflow-y-auto border-r border-white/40 bg-white/95 p-6 text-[#111111] shadow-[24px_0_70px_rgba(0,0,0,0.28)] backdrop-blur-xl"
              initial={{ x: '-100%', opacity: 0, filter: 'blur(8px)' }}
              animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ x: '-100%', opacity: 0, filter: 'blur(8px)' }}
              transition={{
                duration: 0.42,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="mb-8 flex items-center justify-between">
                <motion.span
                  className="text-xl font-bold tracking-tight"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.28 }}
                >
                  Menu
                </motion.span>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5] transition-all duration-300 hover:bg-[#0F5A46] hover:text-white active:scale-95"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.32 }}
              >
                <SearchBox
                  mobile
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  searchResults={searchResults}
                  setMobileMenuOpen={setMobileMenuOpen}
                />
              </motion.div>

              <nav className="flex flex-col gap-1">
                {[...navItems, ['My Account', accountPath]].map(
                  ([label, href], index) => (
                    <motion.a
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.2 + index * 0.035,
                        duration: 0.28,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="block rounded-xl px-4 py-4 text-base font-semibold tracking-tight text-[#111111] transition-all duration-300 hover:translate-x-1 hover:bg-[#F5F5F5] hover:text-[#0F5A46]"
                    >
                      {label}
                    </motion.a>
                  )
                )}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}