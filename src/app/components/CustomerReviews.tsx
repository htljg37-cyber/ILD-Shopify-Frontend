import {BadgeCheck, ExternalLink, MessageSquareQuote, Star} from 'lucide-react';
import {
  REVIEW_SOURCES,
  REVIEW_STATS,
  reviewsForHandle,
  writtenReviews,
} from '../../lib/externalReviews';
import type {ExternalReview} from '../../lib/externalReviews';

function Stars({rating, size = 'h-4 w-4'}: {rating: number; size?: string}) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`${size} ${
            value <= Math.round(rating)
              ? 'fill-[#C8A45D] text-[#C8A45D]'
              : 'fill-[#E1DCD2] text-[#E1DCD2]'
          }`}
        />
      ))}
    </div>
  );
}

function formatDate(review: ExternalReview) {
  if (review.when) return review.when;
  if (!review.date) return '';
  return new Date(`${review.date}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ReviewCard({review, showProduct = true}: {review: ExternalReview; showProduct?: boolean}) {
  const source = REVIEW_SOURCES[review.source];
  return (
    <article className="flex h-full flex-col rounded-3xl border border-[#E1DCD2] bg-white/85 p-5 shadow-[0_12px_34px_rgba(17,17,17,0.045)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Stars rating={review.rating} />
        <span className="rounded-full bg-[#0F5A46]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0F5A46]">
          {source.label}
        </span>
      </div>

      {review.text ? (
        <p className="mb-4 flex-1 text-sm leading-relaxed text-[#111111]">“{review.text}”</p>
      ) : (
        <p className="mb-4 flex-1 text-sm italic text-[#717182]">Rated {review.rating} out of 5, no written comment.</p>
      )}

      {showProduct && review.handle ? (
        <a
          href={`/product/${review.handle}`}
          className="mb-3 line-clamp-1 text-xs font-semibold text-[#0F5A46] hover:underline"
        >
          {review.product}
        </a>
      ) : showProduct ? (
        <p className="mb-3 line-clamp-1 text-xs font-semibold text-[#717182]">{review.product}</p>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-[#EFEAE1] pt-3 text-xs text-[#717182]">
        <span className="font-semibold text-[#111111]">{review.author}</span>
        <span className="flex items-center gap-1">
          <BadgeCheck className="h-3.5 w-3.5 text-[#0F5A46]" />
          Verified purchase · {formatDate(review)}
        </span>
      </div>
    </article>
  );
}

function SourceSummary() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <a
        href={REVIEW_SOURCES.tiktok.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-4 rounded-3xl border border-[#E1DCD2] bg-white/85 p-5 transition-colors hover:border-[#0F5A46]/30"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#717182]">TikTok Shop</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-3xl font-extrabold text-[#111111]">{REVIEW_STATS.tiktok.average.toFixed(1)}</span>
            <Stars rating={REVIEW_STATS.tiktok.average} />
          </div>
          <p className="mt-1 text-sm text-[#717182]">{REVIEW_STATS.tiktok.count} verified reviews</p>
        </div>
        <ExternalLink className="h-5 w-5 text-[#717182] group-hover:text-[#0F5A46]" />
      </a>

      <a
        href={REVIEW_SOURCES.ebay.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-4 rounded-3xl border border-[#E1DCD2] bg-white/85 p-5 transition-colors hover:border-[#0F5A46]/30"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#717182]">eBay</p>
          <p className="mt-1 text-3xl font-extrabold text-[#111111]">{REVIEW_STATS.ebay.positivePercent}% positive</p>
          <p className="mt-1 text-sm text-[#717182]">
            {REVIEW_STATS.ebay.ratings} ratings{REVIEW_STATS.ebay.topRated ? ' · Top Rated Seller' : ''}
          </p>
        </div>
        <ExternalLink className="h-5 w-5 text-[#717182] group-hover:text-[#0F5A46]" />
      </a>
    </div>
  );
}

// Home page: store-level summary plus every written review.
export function CustomerReviews() {
  const reviews = writtenReviews();
  return (
    <section className="relative bg-[#F7F5F0] pt-8 pb-10 md:pt-10 md:pb-12">
      <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-10">
        <div className="mb-8 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white/85 px-4 py-2 shadow-sm">
            <MessageSquareQuote className="h-4 w-4 text-[#C8A45D]" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#0F5A46]">Customer Reviews</span>
          </div>
          <h2 className="mb-3 text-4xl font-extrabold tracking-[-0.045em] text-[#111111] md:text-5xl">
            What Our Buyers Say
          </h2>
          <p className="text-base leading-relaxed text-[#717182]">
            We also sell on TikTok Shop and eBay. These are real reviews our customers left there, shown with
            the marketplace they came from. Updated {REVIEW_STATS.updated}.
          </p>
        </div>

        <div className="mb-6">
          <SourceSummary />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {reviews.map((review, index) => (
            <ReviewCard key={`${review.source}-${review.author}-${index}`} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Product page: reviews for this product from other marketplaces, if any.
export function ProductReviews({handle}: {handle: string}) {
  const reviews = reviewsForHandle(handle);
  if (reviews.length === 0) return null;
  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <section className="mx-auto w-full max-w-[1680px] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#111111] md:text-3xl">Reviews from our marketplaces</h2>
          <p className="mt-1 text-sm text-[#717182]">
            Verified buyers of this product on TikTok Shop and eBay.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Stars rating={average} size="h-5 w-5" />
          <span className="text-sm font-semibold text-[#111111]">
            {average.toFixed(1)} · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {reviews.map((review, index) => (
          <ReviewCard key={`${review.source}-${review.author}-${index}`} review={review} showProduct={false} />
        ))}
      </div>
    </section>
  );
}

