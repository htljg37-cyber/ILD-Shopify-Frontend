import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, MutableRefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { CategoryCards } from './components/CategoryCards';
import { TrustBar } from './components/TrustBar';
import { CollectibleBrands } from './components/CollectibleBrands';
import { FeaturedProducts } from './components/FeaturedProducts';
import { WhyShopSection } from './components/WhyShopSection';
import { Footer } from './components/Footer';
import { CollectionProducts } from './components/CollectionProducts';
import { CollectionsPage } from './components/CollectionsPage';
import { ProductPage } from './components/ProductPage';
import CartPage from './components/CartPage';
import { ScaleGuide } from './components/ScaleGuide';
import { VehicleMakes } from './components/VehicleMakes';
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

const NAVIGATION_DELAY_MS = 320;
const DEFAULT_TRANSITION_MS = 900;
const MIN_LOADER_VISIBLE_MS = 650;
const PRODUCT_TRANSITION_TIMEOUT_MS = 12000;

function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function HomePage() {
  return (
    <>
      <CategoryCards />

      <TrustBar />

      <motion.div {...revealSection}>
        <CollectibleBrands />
      </motion.div>

      <motion.div {...revealSection}>
        <FeaturedProducts />
      </motion.div>

      <motion.div {...revealSection}>
        <VehicleMakes />
      </motion.div>

      <motion.div {...revealSection}>
        <ScaleGuide />
      </motion.div>

      <motion.div {...revealSection}>
        <WhyShopSection />
      </motion.div>
    </>
  );
}

function DynamicCollectionPage({ handle }: { handle: string }) {
  return <CollectionProducts handle={handle} />;
}

function PageRoute({
  path,
  onProductReady,
}: {
  path: string;
  onProductReady: (path: string) => void;
}) {
  const productMatch = path.match(/^\/product\/(.+)$/);
  const collectionMatch = path.match(/^\/collections\/(.+)$/);

  if (productMatch) {
    return (
      <ProductPage
        handle={productMatch[1]}
        onPageReady={() => onProductReady(path)}
      />
    );
  }
  if (collectionMatch) {
    return <DynamicCollectionPage handle={collectionMatch[1]} />;
  }

  if (path === '/cart') return <CartPage />;

  if (path === '/wishlist') return <WishlistPage />;

  if (path === '/orders') return <OrdersPage />;

  if (path === '/account') {
    return <AccountPage />;
  }

  if (path === '/catalog') {
    return <CatalogPage />;
  }

  if (path === '/new-arrivals') return <NewArrivalsPage />;

  if (path === '/collections') return <CollectionsPage />;

  if (path === '/brands') {
    return <BrandsPage />;
  }

  if (path === '/track-order') {
    return <TrackOrderPage />;
  }

  if (path === '/contact') {
    return <ContactPage />;
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
  const transitionTargetRef = useRef('');
  const transitionStartedAtRef = useRef(0);
  const navigationTimerRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);

  const clearTimer = useCallback(
    (timer: MutableRefObject<number | null>) => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    },
    []
  );

  const finishPageTransition = useCallback(
    (readyPath?: string) => {
      const pendingPath = transitionTargetRef.current;

      if (!pendingPath || (readyPath && readyPath !== pendingPath)) return;

      clearTimer(fallbackTimerRef);
      clearTimer(finishTimerRef);

      const elapsed = performance.now() - transitionStartedAtRef.current;
      const remaining = Math.max(0, MIN_LOADER_VISIBLE_MS - elapsed);

      finishTimerRef.current = window.setTimeout(() => {
        setIsChangingPage(false);
        transitionTargetRef.current = '';
        finishTimerRef.current = null;
      }, remaining);
    },
    [clearTimer]
  );

  useEffect(() => {
    function handlePopState() {
      setPath(window.location.pathname);
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearTimer(navigationTimerRef);
      clearTimer(fallbackTimerRef);
      clearTimer(finishTimerRef);
    };
  }, [clearTimer]);

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
    const destination = new URL(href, window.location.origin);
    const destinationPath = destination.pathname;

    if (
      destinationPath === window.location.pathname &&
      destination.search === window.location.search
    ) {
      return;
    }

    event.preventDefault();
    clearTimer(navigationTimerRef);
    clearTimer(fallbackTimerRef);
    clearTimer(finishTimerRef);

    transitionTargetRef.current = destinationPath;
    transitionStartedAtRef.current = performance.now();
    setIsChangingPage(true);

    navigationTimerRef.current = window.setTimeout(() => {
      navigateTo(href);
      setPath(destinationPath);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      navigationTimerRef.current = null;
    }, NAVIGATION_DELAY_MS);

    const waitsForProduct = /^\/product\/[^/]+$/.test(destinationPath);

    fallbackTimerRef.current = window.setTimeout(
      () => finishPageTransition(destinationPath),
      waitsForProduct
        ? PRODUCT_TRANSITION_TIMEOUT_MS
        : DEFAULT_TRANSITION_MS
    );
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
          <PageRoute path={path} onProductReady={finishPageTransition} />
        </motion.main>
      </AnimatePresence>

      <Footer />
    </div>
  );
}