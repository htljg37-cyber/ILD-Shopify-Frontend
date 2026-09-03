import { memo, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, Layers3 } from 'lucide-react';
import { getCollections } from '../../lib/shopify';

const collectionCardStyle: CSSProperties = {
  contentVisibility: 'auto',
  containIntrinsicSize: '430px',
};

type CollectionCardProps = {
  collection: any;
  priority?: boolean;
};

function getCollectionImageUrl(url: string) {
  try {
    const imageUrl = new URL(url);
    imageUrl.searchParams.set('width', '900');
    return imageUrl.toString();
  } catch {
    return url;
  }
}

const CollectionCard = memo(function CollectionCard({
  collection,
  priority = false,
}: CollectionCardProps) {
  const hasImage = Boolean(collection.image?.url);

  return (
    <a
      href={`/collections/${collection.handle}`}
      style={collectionCardStyle}
      className="group relative isolate overflow-hidden rounded-[1.75rem] border border-[#AEBDB3] bg-[#F5F3ED] shadow-[0_12px_30px_rgba(20,42,33,0.09)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#547E6D] hover:shadow-[0_18px_38px_rgba(20,42,33,0.14)] motion-reduce:transform-none motion-reduce:transition-none"
    >
      <div className="relative h-64 overflow-hidden bg-[linear-gradient(135deg,#102B23_0%,#101714_62%,#342B1C_100%)] sm:h-72">
        {hasImage ? (
          <img
            src={getCollectionImageUrl(collection.image.url)}
            alt={collection.image.altText || collection.title}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(15,90,70,0.45),transparent_58%),linear-gradient(320deg,rgba(200,164,93,0.25),transparent_52%)]" />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,9,0.06)_15%,rgba(5,12,9,0.78)_100%)]" />

        <div className="absolute inset-x-0 bottom-0 p-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#E2C576]">
            Collection
          </p>
          <h2 className="text-2xl font-extrabold leading-tight tracking-[-0.025em] text-white">
            {collection.title}
          </h2>
        </div>
      </div>

      <div className="flex min-h-36 flex-col justify-between p-6">
        <p className="line-clamp-2 text-sm leading-relaxed text-[#667168]">
          {collection.description ||
            'Explore products available in this collection.'}
        </p>

        <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#0F5A46]">
          Explore collection
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDE8E2] transition-colors duration-200 group-hover:bg-[#0F5A46] group-hover:text-white motion-reduce:transition-none">
            <ArrowRight className="h-4 w-4" />
          </span>
        </span>
      </div>
    </a>
  );
});

function CollectionCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#AEBDB3] bg-[#F5F3ED]">
      <div className="h-64 bg-[#AEBDB3] sm:h-72" />
      <div className="space-y-4 p-6">
        <div className="h-4 w-full rounded-full bg-[#D9DED8]" />
        <div className="h-4 w-2/3 rounded-full bg-[#D9DED8]" />
        <div className="h-8 w-36 rounded-full bg-[#D9DED8]" />
      </div>
    </div>
  );
}

export function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCollections() {
      try {
        const data = await getCollections();

        if (isMounted) {
          setCollections(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Unable to load collections:', error);

        if (isMounted) setCollections([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCollections();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="performance-section relative min-h-[70vh] overflow-hidden bg-[radial-gradient(circle_at_6%_6%,rgba(15,90,70,0.17),transparent_28%),radial-gradient(circle_at_94%_8%,rgba(200,164,93,0.14),transparent_24%),linear-gradient(180deg,#C9D6CE_0%,#D7DDD6_42%,#E6E3DB_100%)] py-6 md:py-8">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <div className="relative z-10 mx-auto w-full max-w-[1680px] px-4 md:px-6 lg:px-8">
        <header className="relative mb-7 overflow-hidden rounded-[1.75rem] border border-[#6E9182]/35 bg-[linear-gradient(118deg,#153F34_0%,#102A23_66%,#342D20_100%)] px-6 py-7 shadow-[0_16px_38px_rgba(8,39,31,0.15)] md:px-9 md:py-9">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[36%] md:block">
            <span className="absolute right-20 top-1/2 h-32 w-52 -translate-y-[58%] rotate-[-4deg] rounded-[1.35rem] border border-white/10 bg-white/[0.035]" />
            <span className="absolute right-8 top-1/2 h-32 w-52 -translate-y-[42%] rotate-[5deg] rounded-[1.35rem] border border-[#C8A45D]/25 bg-[#C8A45D]/[0.035]" />
          </div>

          <div className="relative max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#E2C576]">
              <Layers3 className="h-4 w-4" />
              Collections
            </div>

            <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-white md:text-5xl">
              Find your next collection
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
              Explore each category and discover products grouped around the
              things you enjoy collecting.
            </p>
          </div>
        </header>

        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0F5A46]">
              Browse categories
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-[#142019] md:text-3xl">
              Shop by collection
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <CollectionCardSkeleton key={index} />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="rounded-[1.75rem] border border-[#AEBDB3] bg-[#E8ECE7] p-10 text-center shadow-sm">
            <h2 className="text-xl font-extrabold text-[#142019]">
              No collections found
            </h2>
            <p className="mt-2 text-sm text-[#667168]">
              Collections published in Shopify will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {collections.map((collection, index) => (
              <CollectionCard
                key={collection.id || collection.handle}
                collection={collection}
                priority={index < 2}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}