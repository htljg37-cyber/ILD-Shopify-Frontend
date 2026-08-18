import {useEffect, useMemo, useState} from 'react';
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
    return 'Premium';
  }

  return 'Collection';
}

function getCollectionDescription(collection: any) {
  return (
    collection?.description ||
    'Explore selected products from this collection.'
  );
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
  const [collections, setCollections] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    async function loadCollections() {
      const data = await getCollections();
      setCollections(data);
    }

    loadCollections();
  }, []);

  const displayCollections = useMemo(() => {
    return collections.filter(Boolean);
  }, [collections]);

  useEffect(() => {
    if (activeIndex >= displayCollections.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, displayCollections.length]);

  useEffect(() => {
    if (displayCollections.length <= 1 || isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) =>
        (current + 1) % displayCollections.length
      );
    }, 5500);

    return () => {
      window.clearInterval(timer);
    };
  }, [displayCollections.length, isPaused]);

  function showPreviousCollection() {
    if (displayCollections.length === 0) return;

    setActiveIndex((current) =>
      current === 0
        ? displayCollections.length - 1
        : current - 1
    );
  }

  function showNextCollection() {
    if (displayCollections.length === 0) return;

    setActiveIndex(
      (current) => (current + 1) % displayCollections.length
    );
  }

  function handleDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: {offset: {x: number}}
  ) {
    if (info.offset.x > 60) {
      showPreviousCollection();
    }

    if (info.offset.x < -60) {
      showNextCollection();
    }
  }

  return (
    <section
      className="relative overflow-hidden py-16 md:py-20 bg-[radial-gradient(circle_at_10%_10%,rgba(15,90,70,0.08),transparent_28%),radial-gradient(circle_at_90%_30%,rgba(200,164,93,0.12),transparent_30%),linear-gradient(180deg,#FFFFFF_0%,#F8F7F3_100%)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
    >
      <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <motion.div
              initial={{opacity: 0, y: 14}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white/75 px-4 py-2 shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-[#C8A45D]" />

              <span className="text-sm font-semibold text-[#0F5A46]">
                Curated Shopping Paths
              </span>
            </motion.div>

            <motion.h2
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              className="mb-3 text-3xl font-bold tracking-tight text-[#111111] md:text-5xl"
            >
              Shop by Category
            </motion.h2>

            <motion.p
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{delay: 0.1}}
              className="max-w-xl text-[#717182]"
            >
              Move through our curated collections and discover the
              products that match your interests.
            </motion.p>
          </div>

          <a
            href="/collections"
            className="group inline-flex items-center gap-2 text-sm font-bold text-[#0F5A46] transition-all duration-300 hover:-translate-y-0.5"
          >
            View all collections

            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>

        {displayCollections.length === 0 ? (
          <div className="rounded-3xl border border-[#EAE7DF] bg-white/85 p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-[#717182]">
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
              className="relative h-[470px] cursor-grab select-none [perspective:1500px] active:cursor-grabbing md:h-[560px]"
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
                const Icon = getCollectionIcon(collection.title);
                const label = getCollectionLabel(collection.title);
                const description =
                  getCollectionDescription(collection);
                const hasImage = Boolean(collection.image?.url);

                return (
                  <div
                    key={collection.id}
                    className="absolute left-1/2 top-6 w-[82%] max-w-[680px] -translate-x-1/2 md:top-8"
                    style={{
                      zIndex: 40 - distance,
                      pointerEvents: isVisible ? 'auto' : 'none',
                    }}
                  >
                    <motion.article
                      initial={false}
                      animate={{
                        x: `${offset * 58}%`,
                        scale:
                          distance === 0
                            ? 1
                            : distance === 1
                              ? 0.82
                              : 0.67,
                        rotateY:
                          offset === 0
                            ? 0
                            : offset > 0
                              ? -38
                              : 38,
                        opacity:
                          !isVisible
                            ? 0
                            : distance === 0
                              ? 1
                              : distance === 1
                                ? 0.72
                                : 0.3,
                        filter:
                          distance === 0
                            ? 'blur(0px)'
                            : distance === 1
                              ? 'blur(0.4px)'
                              : 'blur(1.2px)',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 190,
                        damping: 24,
                        mass: 0.8,
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
                      className={`relative h-[390px] overflow-hidden rounded-[2rem] border bg-[#111111] shadow-[0_28px_80px_rgba(17,17,17,0.24)] [transform-style:preserve-3d] md:h-[470px] ${
                        isActive
                          ? 'border-[#C8A45D]/50'
                          : 'cursor-pointer border-white/20'
                      }`}
                    >
                      {hasImage ? (
                        <img
                          src={collection.image.url}
                          alt={
                            collection.image.altText ||
                            collection.title
                          }
                          draggable={false}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(15,90,70,0.75),#111111_70%)]">
                          <Icon className="h-24 w-24 text-white/70" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-[#07110E] via-[#07110E]/40 to-black/5" />

                      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5 md:p-7">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-[#0F5A46]/90 text-white shadow-lg backdrop-blur-md">
                          <Icon className="h-6 w-6" />
                        </div>

                        <span className="rounded-full border border-[#C8A45D]/35 bg-black/45 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F2D48A] backdrop-blur-md">
                          {label}
                        </span>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#C8A45D]">
                          ILD Collection
                        </p>

                        <h3 className="mb-3 text-2xl font-extrabold tracking-tight text-white md:text-4xl">
                          {collection.title}
                        </h3>

                        <p className="mb-6 max-w-lg line-clamp-2 text-sm leading-relaxed text-white/75 md:text-base">
                          {description}
                        </p>

                        {isActive && (
                          <a
                            href={`/collections/${collection.handle}`}
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            className="group inline-flex items-center rounded-2xl bg-[#0F5A46] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_32px_rgba(15,90,70,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#126B54]"
                          >
                            Explore Collection

                            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </a>
                        )}
                      </div>

                      {isActive && (
                        <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/15" />
                      )}
                    </motion.article>
                  </div>
                );
              })}
            </motion.div>

            <div className="-mt-2 flex items-center justify-center gap-4 md:mt-0">
              <button
                type="button"
                onClick={showPreviousCollection}
                disabled={displayCollections.length <= 1}
                aria-label="Previous collection"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#EAE7DF] bg-white text-[#0F5A46] shadow-[0_10px_28px_rgba(17,17,17,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0F5A46]/30 hover:bg-[#0F5A46] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="min-w-[92px] rounded-full border border-[#EAE7DF] bg-white/85 px-4 py-2 text-center text-sm font-bold text-[#111111] shadow-sm">
                {String(activeIndex + 1).padStart(2, '0')}
                <span className="mx-2 text-[#C8A45D]">/</span>
                {String(displayCollections.length).padStart(2, '0')}
              </div>

              <button
                type="button"
                onClick={showNextCollection}
                disabled={displayCollections.length <= 1}
                aria-label="Next collection"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#EAE7DF] bg-white text-[#0F5A46] shadow-[0_10px_28px_rgba(17,17,17,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0F5A46]/30 hover:bg-[#0F5A46] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 text-center text-xs font-semibold text-[#717182]">
              Drag, swipe, or use the arrows to explore collections.
            </p>
          </>
        )}
      </div>
    </section>
  );
}