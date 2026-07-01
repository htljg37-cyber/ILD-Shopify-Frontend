import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { CategoryCards } from './components/CategoryCards';
import { FeaturedProducts } from './components/FeaturedProducts';
import { WhyShopSection } from './components/WhyShopSection';
import { NewsletterSection } from './components/NewsletterSection';
import { Footer } from './components/Footer';
import { PageHero } from './components/PageHero';
import { CollectionProducts } from './components/CollectionProducts';
import { ProductPage } from './components/ProductPage';
import CartPage from './components/CartPage';
import { CatalogPage } from './components/CatalogPage';
import { NewArrivalsPage } from './components/NewArrivalsPage';
import { BrandsPage } from './components/BrandsPage';
import { TrackOrderPage } from './components/TrackOrderPage';
import { ContactPage } from './components/ContactPage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { TermsOfServicePage } from './components/TermsOfServicePage';
import { ShippingPolicyPage } from './components/ShippingPolicyPage';
import { ReturnsPolicyPage } from './components/ReturnsPolicyPage';
import { AccountPage } from './components/AccountPage';
import { WishlistPage } from './components/WishlistPage';
import OrdersPage from './components/OrdersPage';
import { getCollections } from '../lib/shopify';

const revealSection = {
  initial: { opacity: 0, y: 32, filter: 'blur(6px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-120px' },
  transition: {
    duration: 0.7,
    ease: [0.22, 1, 0.36, 1] as const,
  },
};

const pageAnimation = {
  initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, filter: 'blur(6px)' },
  transition: {
    duration: 0.45,
    ease: [0.22, 1, 0.36, 1] as const,
  },
};

function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function HomePage() {
  return (
    <>
      <HeroSection />

      <motion.div {...revealSection}>
        <CategoryCards />
      </motion.div>

      <motion.div {...revealSection}>
        <FeaturedProducts />
      </motion.div>

      <motion.div {...revealSection}>
        <WhyShopSection />
      </motion.div>

      <motion.div {...revealSection}>
        <NewsletterSection />
      </motion.div>
    </>
  );
}

function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    async function loadCollections() {
      const data = await getCollections();
      setCollections(data);
    }

    loadCollections();
  }, []);

  return (
    <>
      <PageHero
        title="Collections"
        description="Explore curated categories from IL Distributions LLC."
      />

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#FAFAFA_0%,#F6F4EF_100%)] py-16 md:py-20">
        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:46px_46px]" />

        <div className="container relative z-10 mx-auto px-4 md:px-6">
          {collections.length === 0 ? (
            <div className="rounded-3xl border border-[#EAE7DF] bg-white/85 p-10 text-center shadow-sm">
              <p className="text-sm font-semibold text-[#717182]">
                No collections found yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
              {collections.map((collection, index) => {
                const hasImage = Boolean(collection.image?.url);

                return (
                  <motion.a
                    key={collection.id}
                    href={`/collections/${collection.handle}`}
                    initial={{ opacity: 0, y: 24, filter: 'blur(5px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{
                      delay: index * 0.08,
                      duration: 0.6,
                      ease: [0.22, 1, 0.36, 1] as const,
                    }}
                    className="group overflow-hidden rounded-3xl border border-[#EAE7DF] bg-white/85 shadow-[0_10px_30px_rgba(17,17,17,0.04)] backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,90,70,0.14)]"
                  >
                    <div className="relative flex h-72 items-center justify-center overflow-hidden bg-gradient-to-br from-[#071611] via-[#111111] to-[#0F5A46] px-6">
                      {hasImage ? (
                        <>
                          <img
                            src={collection.image.url}
                            alt={collection.image.altText || collection.title}
                            className="absolute inset-0 h-full w-full object-cover opacity-50 transition-all duration-700 group-hover:scale-105 group-hover:opacity-60"
                          />
                          <div className="absolute inset-0 bg-black/45" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(200,164,93,0.22),transparent_35%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      )}

                      <h2 className="relative z-10 text-center text-3xl font-extrabold tracking-tight text-white transition-transform duration-300 group-hover:scale-[1.03]">
                        {collection.title}
                      </h2>
                    </div>

                    <div className="p-6">
                      <p className="line-clamp-2 text-sm leading-relaxed text-[#717182]">
                        {collection.description ||
                          'Explore selected products from this collection.'}
                      </p>

                      <span className="mt-5 inline-block text-sm font-bold text-[#0F5A46] transition-all duration-300 group-hover:translate-x-1">
                        Explore Collection →
                      </span>
                    </div>
                  </motion.a>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function DynamicCollectionPage({ handle }: { handle: string }) {
  const [collection, setCollection] = useState<any>(null);

  useEffect(() => {
    async function loadCollection() {
      const collections = await getCollections();
      const foundCollection = collections.find(
        (item: any) => item.handle === handle
      );

      setCollection(foundCollection || null);
    }

    loadCollection();
  }, [handle]);

  const title = collection?.title || handle.replaceAll('-', ' ');
  const description =
    collection?.description ||
    'Explore products available in this collection.';

  return (
    <>
      <PageHero title={title} description={description} />
      <CollectionProducts handle={handle} />
    </>
  );
}

function PageRoute({ path }: { path: string }) {
  const productMatch = path.match(/^\/product\/(.+)$/);
  const collectionMatch = path.match(/^\/collections\/(.+)$/);

  if (productMatch) return <ProductPage handle={productMatch[1]} />;
  if (collectionMatch) {
    return <DynamicCollectionPage handle={collectionMatch[1]} />;
  }

  if (path === '/cart') return <CartPage />;

  if (path === '/wishlist') {
  return (
    <>
      <PageHero
        title="Wishlist"
        description="View your saved products and continue shopping anytime."
      />
      <WishlistPage />
    </>
  );

  if (path === '/orders') {
  return (
    <>
      <PageHero
        title="My Orders"
        description="Review your purchase history and order status."
      />
      <OrdersPage />
    </>
  );
}
}

  if (path === '/account') {
    return (
      <>
        <PageHero
          title="Customer Account"
          description="Customer accounts and login features will be available soon."
        />
        <AccountPage />
      </>
    );
  }

  if (path === '/catalog') {
    return (
      <>
        <PageHero
          title="Catalog"
          description="Browse all premium products available from IL Distributions LLC."
        />
        <CatalogPage />
      </>
    );
  }

  if (path === '/new-arrivals') {
    return (
      <>
        <PageHero
          title="New Arrivals"
          description="Explore the newest products added to our store."
        />
        <NewArrivalsPage />
      </>
    );
  }

  if (path === '/collections') return <CollectionsPage />;

  if (path === '/brands') {
    return (
      <>
        <PageHero
          title="Brands"
          description="Explore all available brands from IL Distributions LLC."
        />
        <BrandsPage />
      </>
    );
  }

  if (path === '/track-order') {
    return (
      <>
        <PageHero
          title="Track Order"
          description="Find tracking details and support information for your order."
        />
        <TrackOrderPage />
      </>
    );
  }

  if (path === '/contact') {
    return (
      <>
        <PageHero
          title="Contact"
          description="Get in touch with IL Distributions LLC for support, orders, or wholesale inquiries."
        />
        <ContactPage />
      </>
    );
  }

  if (path === '/privacy-policy') return <PrivacyPolicyPage />;
  if (path === '/terms-of-service') return <TermsOfServicePage />;
  if (path === '/shipping-policy') return <ShippingPolicyPage />;
  if (path === '/returns-policy') return <ReturnsPolicyPage />;

  return <HomePage />;
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [isChangingPage, setIsChangingPage] = useState(false);

  useEffect(() => {
    function handlePopState() {
      setPath(window.location.pathname);
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  function handlePageClick(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || isChangingPage) return;

    const target = event.target as HTMLElement;
    const link = target.closest('a') as HTMLAnchorElement | null;

    if (!link) return;

    const href = link.getAttribute('href');

    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      link.target === '_blank'
    ) {
      return;
    }

    const isInternalLink = href.startsWith('/');

    if (!isInternalLink) return;
    if (href === window.location.pathname) return;

    event.preventDefault();
    setIsChangingPage(true);

    window.setTimeout(() => {
      navigateTo(href);
      setPath(href);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }, 320);

    window.setTimeout(() => {
      setIsChangingPage(false);
    }, 900);
  }

  return (
    <div
      onClick={handlePageClick}
      className="min-h-screen bg-[#FAFAFA] font-['Plus_Jakarta_Sans'] text-[#111111] antialiased"
    >
      <AnimatePresence>
        {isChangingPage && (
          <motion.div
            key="page-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(15,90,70,0.40),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(200,164,93,0.25),transparent_32%),linear-gradient(135deg,#071611_0%,#111111_55%,#1B1710_100%)]"
          >
            <div className="relative text-center">
              <div className="absolute -inset-10 rounded-full bg-[#0F5A46]/20 blur-3xl" />

              <div className="relative mx-auto mb-5 h-14 w-14 rounded-full border border-white/10 bg-white/[0.06] p-2 shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                <div className="h-full w-full animate-spin rounded-full border-2 border-white/20 border-t-[#C8A45D]" />
              </div>

              <p className="relative text-sm font-bold tracking-[0.28em] text-white/85">
                IL DISTRIBUTIONS
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header />

      <AnimatePresence mode="wait">
        <motion.main key={path} {...pageAnimation}>
          <PageRoute path={path} />
        </motion.main>
      </AnimatePresence>

      <Footer />
    </div>
  );
}