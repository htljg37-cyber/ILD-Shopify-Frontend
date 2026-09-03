import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {motion} from 'motion/react';
import {
  ArrowRight,
  Car,
  Package,
  Sparkles,
  Star,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {getCollections} from '../../lib/shopify';

function getCollectionIcon(title = '') {
  const normalizedTitle = title.toLowerCase();

  if (
    normalizedTitle.includes('diecast') ||
    normalizedTitle.includes('model') ||
    normalizedTitle.includes('cars') ||
    normalizedTitle.includes('vehicles')
  ) {
    return Car;
  }

  if (
    normalizedTitle.includes('collectible') ||
    normalizedTitle.includes('figure') ||
    normalizedTitle.includes('toy')
  ) {
    return Package;
  }

  if (
    normalizedTitle.includes('new') ||
    normalizedTitle.includes('arrival')
  ) {
    return Sparkles;
  }

  if (
    normalizedTitle.includes('featured') ||
    normalizedTitle.includes('premium')
  ) {
    return Star;
  }

  return Grid3X3;
}

function getCollectionLabel(title = '') {
  const normalizedTitle = title.toLowerCase();

  if (
    normalizedTitle.includes('diecast') ||
    normalizedTitle.includes('model') ||
    normalizedTitle.includes('cars') ||
    normalizedTitle.includes('vehicles')
  ) {
    return 'Vehicles';
  }

  if (
    normalizedTitle.includes('collectible') ||
    normalizedTitle.includes('figure') ||
    normalizedTitle.includes('toy')
  ) {
    return 'Collectibles';
  }

  if (
    normalizedTitle.includes('new') ||
    normalizedTitle.includes('arrival')
  ) {
    return 'Latest';
  }

  if (
    normalizedTitle.includes('featured') ||
    normalizedTitle.includes('premium')
  ) {
    return 'Featured';
  }

  return 'Collection';
}

function getCollectionDescription(collection: any) {
  return (
    collection?.description ||
    'Explore selected products from this collection.'
  );
}

function getOptimizedCollectionImage(url = '', width = 1100) {
  if (!url) return '';

  try {
    const imageUrl = new URL(url);

    if (imageUrl.hostname.includes('cdn.shopify.com')) {
      imageUrl.searchParams.set('width', String(width));
    }

    return imageUrl.toString();
  } catch {
    return url;
  }
}

function getCircularOffset(
  index: number,
  activeIndex: number,
  total: number
) {
  let offset = index - activeIndex;

  if (offset > total / 2) {
    offset -= total;
  }

  if (offset < -total / 2) {
    offset += total;
  }

  return offset;
}

export function CategoryCards() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCollections() {
      try {
        const data = await getCollections();
        if (active) setCollections(Array.isArray(data) ? data : []);
      } catch {
        if (active) setCollections([]);
      }
    }

    loadCollections();

    return () => {
      active = false;
    };
  }, []);

  const displayCollections = useMemo(() => {
    return collections.filter(Boolean).map((collection) => ({
      ...collection,
      cardIcon: getCollectionIcon(collection.title),
      cardLabel: getCollectionLabel(collection.title),
      cardDescription: getCollectionDescription(collection),
      optimizedImageUrl: getOptimizedCollectionImage(
        collection.image?.url
      ),
    }));
  }, [collections]);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry) {
          setIsSectionVisible((current) =>
            current === entry.isIntersecting ? current : entry.isIntersecting
          );
        }
      },
      {
        rootMargin: '160px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleVisibilityChange() {
      const nextValue = document.visibilityState === 'visible';
      setIsPageVisible((current) =>
        current === nextValue ? current : nextValue
      );
    }

    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };
  }, []);

  useEffect(() => {
    if (activeIndex >= displayCollections.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, displayCollections.length]);

  useEffect(() => {
    if (
      displayCollections.length <= 1 ||
      isPaused ||
      !isSectionVisible ||
      !isPageVisible
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) =>
        (current + 1) % displayCollections.length
      );
    }, 6000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    displayCollections.length,
    isPaused,
    isSectionVisible,
    isPageVisible,
  ]);

  const showPreviousCollection = useCallback(function showPreviousCollection() {
    if (displayCollections.length === 0) return;

    setActiveIndex((current) =>
      current === 0
        ? displayCollections.length - 1
        : current - 1
    );
  }, [displayCollections.length]);

  const showNextCollection = useCallback(function showNextCollection() {
    if (displayCollections.length === 0) return;

    setActiveIndex(
      (current) => (current + 1) % displayCollections.length
    );
  }, [displayCollections.length]);

  const handleDragEnd = useCallback(function handleDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: {offset: {x: number}}
  ) {
    if (info.offset.x > 60) {
      showPreviousCollection();
    }

    if (info.offset.x < -60) {
      showNextCollection();
    }

    setIsPaused(false);
  }, [showNextCollection, showPreviousCollection]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#07110E] pb-12 pt-8 md:pb-10 md:pt-8 [content-visibility:auto] [contain-intrinsic-size:720px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_18%,rgba(15,90,70,0.65),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(200,164,93,0.20),transparent_26%),linear-gradient(135deg,#07110E_0%,#0A1511_48%,#17130D_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.055] bg-[linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:46px_46px]" />
      <div className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 select-none whitespace-nowrap text-[18vw] font-black uppercase leading-none tracking-[-0.08em] text-white/[0.025]">
        Collectibles
      </div>
      <div className="pointer-events-none absolute -left-20 top-36 h-72 w-72 rounded-full border border-[#C8A45D]/10" />
      <div className="pointer-events-none absolute -left-8 top-48 h-48 w-48 rounded-full border border-[#C8A45D]/10" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mx-auto mb-5 max-w-6xl md:mb-4">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <motion.div
                initial={{opacity: 0, y: 14}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C8A45D]/25 bg-[#173029] px-4 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.16)]"
              >
                <Sparkles className="h-4 w-4 text-[#E3C06B]" />
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/85">
                  Start Your Collection
                </span>
              </motion.div>

              <motion.h2
                initial={{opacity: 0, y: 16}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                className="mb-2 text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-4xl md:text-5xl"
              >
                Shop by Category
              </motion.h2>

              <motion.p
                initial={{opacity: 0, y: 16}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{delay: 0.1}}
                className="max-w-2xl text-sm leading-relaxed text-white/65 md:text-base"
              >
                Explore diecast models, collectible figures, display pieces,
                and more from ILD Distributions.
              </motion.p>
            </div>

            <a
              href="/collections"
              className="group inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-[#14241F] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.14)] transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-[#C8A45D]/45 hover:bg-[#1A3028]"
            >
              View All Collections
              <ArrowRight className="h-4 w-4 text-[#E3C06B] transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {displayCollections.length === 0 ? (
          <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-[#14241F] p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-white/65">
              No collections found yet.
            </p>
          </div>
        ) : (
          <>
            <motion.div
              drag="x"
              dragConstraints={{left: 0, right: 0}}
              dragElastic={0.12}
              onDragStart={() => setIsPaused(true)}
              onDragEnd={handleDragEnd}
              className="relative mx-auto h-[430px] max-w-[1500px] cursor-grab select-none [perspective:1600px] active:cursor-grabbing sm:h-[470px] md:h-[455px]"
            >
              {displayCollections.map((collection, index) => {
                const offset = getCircularOffset(
                  index,
                  activeIndex,
                  displayCollections.length
                );

                const distance = Math.abs(offset);
                const isActive = offset === 0;
                const isVisible = distance <= 2;
                const Icon = collection.cardIcon;
                const label = collection.cardLabel;
                const description = collection.cardDescription;
                const hasImage = Boolean(collection.optimizedImageUrl);

                if (!isVisible) return null;

                return (
                  <div
                    key={collection.id}
                    className={`absolute left-1/2 top-2 w-[90%] max-w-[760px] -translate-x-1/2 md:top-3 md:block md:w-[76%] ${
                      isActive ? 'block' : 'hidden'
                    }`}
                    style={{
                      zIndex: 40 - distance,
                      pointerEvents: isVisible ? 'auto' : 'none',
                    }}
                  >
                    <motion.article
                      initial={false}
                      style={{
                        willChange:
                          isSectionVisible && isPageVisible
                            ? 'transform, opacity'
                            : 'auto',
                        backfaceVisibility: 'hidden',
                      }}
                      animate={{
                        x: `${offset * 61}%`,
                        scale:
                          distance === 0
                            ? 1
                            : distance === 1
                              ? 0.84
                              : 0.69,
                        rotateY:
                          offset === 0
                            ? 0
                            : offset > 0
                              ? -34
                              : 34,
                        opacity:
                          !isVisible
                            ? 0
                            : distance === 0
                              ? 1
                              : distance === 1
                                ? 0.68
                                : 0.22,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 185,
                        damping: 25,
                        mass: 0.82,
                      }}
                      onClick={() => {
                        if (!isActive) {
                          setActiveIndex(index);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (
                          !isActive &&
                          (event.key === 'Enter' ||
                            event.key === ' ')
                        ) {
                          event.preventDefault();
                          setActiveIndex(index);
                        }
                      }}
                      role={!isActive ? 'button' : undefined}
                      tabIndex={!isActive && isVisible ? 0 : -1}
                      aria-label={
                        !isActive
                          ? `Show ${collection.title} collection`
                          : undefined
                      }
                      className={`relative h-[390px] overflow-hidden rounded-[1.75rem] border bg-[#111111] shadow-[0_18px_42px_rgba(0,0,0,0.38)] [transform-style:preserve-3d] sm:h-[430px] md:h-[420px] md:rounded-[2.25rem] ${
                        isActive
                          ? 'border-[#C8A45D]/55'
                          : 'cursor-pointer border-white/15'
                      }`}
                    >
                      {hasImage ? (
                        <img
                          src={collection.optimizedImageUrl}
                          alt={
                            collection.image.altText ||
                            collection.title
                          }
                          draggable={false}
                          loading={isActive ? 'eager' : 'lazy'}
                          decoding="async"
                          fetchPriority={isActive ? 'high' : 'auto'}
                          width="1100"
                          height="620"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(15,90,70,0.75),#111111_70%)]">
                          <Icon className="h-24 w-24 text-white/70" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(4,15,12,0.10)_35%,rgba(4,15,12,0.92)_100%)]" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(200,164,93,0.16),transparent_32%)]" />

                      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5 md:p-7">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-[#0F5A46] text-white shadow-lg md:h-12 md:w-12">
                          <Icon className="h-5 w-5 md:h-6 md:w-6" />
                        </div>

                        <span className="rounded-full border border-[#C8A45D]/35 bg-black/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F2D48A] md:text-[11px]">
                          {label}
                        </span>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 md:p-8">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#E3C06B] md:text-xs">
                          ILD Collection
                        </p>

                        <h3 className="mb-2 max-w-2xl text-2xl font-extrabold tracking-[-0.035em] text-white sm:text-3xl md:mb-3 md:text-4xl">
                          {collection.title}
                        </h3>

                        <p className="mb-5 max-w-xl line-clamp-2 text-sm leading-relaxed text-white/72 md:mb-6 md:text-base">
                          {description}
                        </p>

                        {isActive && (
                          <a
                            href={`/collections/${collection.handle}`}
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            className="group inline-flex items-center rounded-xl bg-[#0F5A46] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(15,90,70,0.32)] transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#126B54] md:rounded-2xl md:px-5 md:py-3"
                          >
                            Explore Collection
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </a>
                        )}
                      </div>

                      {isActive && (
                        <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/15 md:rounded-[2.25rem]" />
                      )}
                    </motion.article>
                  </div>
                );
              })}
            </motion.div>

            <div className="-mt-1 flex items-center justify-center gap-3 md:mt-0 md:gap-4">
              <button
                type="button"
                onClick={showPreviousCollection}
                disabled={displayCollections.length <= 1}
                aria-label="Previous collection"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#14241F] text-white shadow-[0_8px_20px_rgba(0,0,0,0.22)] transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-[#C8A45D]/45 hover:bg-[#0F5A46] disabled:cursor-not-allowed disabled:opacity-40 md:h-12 md:w-12"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div
                className="min-w-[92px] rounded-full border border-white/15 bg-[#14241F] px-4 py-2 text-center text-sm font-bold text-white shadow-sm"
                aria-live="polite"
              >
                {String(activeIndex + 1).padStart(2, '0')}
                <span className="mx-2 text-[#E3C06B]">/</span>
                {String(displayCollections.length).padStart(2, '0')}
              </div>

              <button
                type="button"
                onClick={showNextCollection}
                disabled={displayCollections.length <= 1}
                aria-label="Next collection"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#14241F] text-white shadow-[0_8px_20px_rgba(0,0,0,0.22)] transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-[#C8A45D]/45 hover:bg-[#0F5A46] disabled:cursor-not-allowed disabled:opacity-40 md:h-12 md:w-12"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-center text-[11px] font-semibold text-white/45 md:mt-4 md:text-xs">
              Drag, swipe, or use the arrows to explore collections.
            </p>
          </>
        )}
      </div>
    </section>
  );
}