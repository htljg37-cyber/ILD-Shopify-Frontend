// Reviews that IL Distributions customers left on other marketplaces where the
// store also sells. They are shown with their source on every card so nobody
// mistakes them for reviews written on this site, and they are deliberately
// NOT added to structured data (Google does not allow third-party reviews to be
// marked up as the site's own rating).
//
// All TikTok Shop reviews are listed, including the lower ratings; leaving the
// critical ones out would misrepresent what buyers think. Names are shortened
// for privacy. Customer photos are not reused.
//
// To add a review: append it below with the product handle it belongs to (or
// leave handle empty for store-level feedback) and update REVIEW_STATS.

export type ReviewSource = 'tiktok' | 'ebay';

export type ExternalReview = {
  source: ReviewSource;
  author: string;
  rating: number; // 1-5
  text?: string;
  date?: string; // YYYY-MM-DD (TikTok shows exact dates)
  when?: string; // eBay only shows a period, e.g. 'Past 6 months'
  product: string;
  handle?: string;
};

export const REVIEW_SOURCES = {
  tiktok: {
    label: 'TikTok Shop',
    profileUrl: 'https://www.tiktok.com/@ildcollectibles',
  },
  ebay: {
    label: 'eBay',
    profileUrl: 'https://www.ebay.com/fdbk/feedback_profile/ild_distributions',
  },
} as const;

// Totals as shown on each marketplace, checked November 2026.
export const REVIEW_STATS = {
  updated: 'November 2026',
  tiktok: {count: 18, average: 4.7},
  ebay: {positivePercent: 100, ratings: 167, topRated: true},
};

export const EXTERNAL_REVIEWS: ExternalReview[] = [
  // TikTok Shop: all 18 verified-purchase reviews
  {source: 'tiktok', author: 'Rony B.', rating: 5, date: '2026-10-26', product: "Fast & Furious Dom's Dodge Charger R/T 1:32", handle: 'jada-fast-furious-doms-dodge-charger-rt-1-32-diecast'},
  {source: 'tiktok', author: 'Damaris P.', rating: 5, text: 'Es lindo, y de buena calidad me, solo q es muy pequeño y no le abren las puertas', date: '2026-10-25', product: 'Kinsmart USPS LLV 1:72 Mail Truck', handle: 'kinsmart-usps-llv-1-72-diecast-mail-truck'},
  {source: 'tiktok', author: 'Chirilo A.', rating: 4, date: '2026-10-18', product: 'Fast & Furious 1995 Toyota Supra 1:32', handle: 'jada-1995-toyota-supra-black-1-32-fast-furious-diecast'},
  {source: 'tiktok', author: 'NanoLux', rating: 4, text: "Came lil dis painted in the front but it's ok everything else good", date: '2026-08-31', product: "Han's Mazda RX-7 1:32", handle: 'jada-fast-furious-hans-mazda-rx7-orange-1-32-diecast'},
  {source: 'tiktok', author: 'Escobar C.', rating: 3, text: 'Me gustó solo que está un poco más pequeña de lo que pensé', date: '2026-08-24', product: '2024 Toyota Tacoma Trailhunter 1:24 Black', handle: 'toyota-tacoma-trailhunter-black-1-24-diecast-model'},
  {source: 'tiktok', author: 'Eddy', rating: 5, text: 'Thank you 😊', date: '2026-08-10', product: 'Funko Pop! Garfield Nermal #51', handle: 'funko-pop-garfield-nermal-51-vinyl-figure'},
  {source: 'tiktok', author: 'Eddy', rating: 5, text: 'Thank you TikTok', date: '2026-08-10', product: 'Funko Pop! Garfield Odie #52', handle: 'funko-pop-odie-52-garfield-comics-vinyl-figure'},
  {source: 'tiktok', author: 'brl1980', rating: 5, date: '2026-07-26', product: 'Maisto Honda CBR600RR 1:12', handle: 'maisto-honda-cbr600rr-1-12-diecast-motorcycle-model'},
  {source: 'tiktok', author: 'R**4', rating: 5, text: 'Great true to scale pro Ice and shipping excellent', date: '2026-06-28', product: 'Maisto Toyota GR Supra 1:24 Red', handle: 'maisto-1-24-toyota-gr-supra-red-special-edition'},
  {source: 'tiktok', author: 'Leos Auto Care', rating: 3, text: 'Poor quantity', date: '2026-06-20', product: 'Motor Max BMW M4 GT3 1:24', handle: 'motor-max-bmw-m4-gt3-midnight-eclipse-124'},
  {source: 'tiktok', author: 'Karloz', rating: 5, date: '2026-06-19', product: 'Maisto Toyota Tacoma TRD Pro 1:27', handle: 'maisto-toyota-tacoma-trd-pro-off-road-127'},
  {source: 'tiktok', author: 'mood.off', rating: 5, date: '2026-06-17', product: 'Motor Max BMW M4 GT3 1:24', handle: 'motor-max-bmw-m4-gt3-midnight-eclipse-124'},
  {source: 'tiktok', author: 'Yinyi C.', rating: 5, date: '2026-06-16', product: "Han's Mazda RX-7 1:32", handle: 'jada-fast-furious-hans-mazda-rx7-orange-1-32-diecast'},
  {source: 'tiktok', author: 'Eva', rating: 5, date: '2026-06-06', product: 'Maisto Toyota Tacoma TRD Pro 1:27', handle: 'maisto-toyota-tacoma-trd-pro-off-road-127'},
  {source: 'tiktok', author: 'G. Fong', rating: 5, date: '2026-05-26', product: 'Maisto 1964 Chevrolet Impala SS Lowrider 1:26', handle: '1964-chevrolet-impala-ss-lowrider-maisto-1-26'},
  {source: 'tiktok', author: 'Betto N.', rating: 5, date: '2026-05-25', product: 'Maisto 1964 Chevrolet Impala SS Lowrider 1:26', handle: '1964-chevrolet-impala-ss-lowrider-maisto-1-26'},
  {source: 'tiktok', author: 'Angelo & Michelle', rating: 5, date: '2026-05-19', product: '2024 Toyota Tacoma Trailhunter 1:24 Black', handle: 'toyota-tacoma-trailhunter-black-1-24-diecast-model'},
  {source: 'tiktok', author: 'Wilfran M.', rating: 5, date: '2026-04-30', product: '2024 Toyota Tacoma TRD Off-Road 1:24 White', handle: '2024-toyota-tacoma-trd-off-road-white-1-24-mijo-diecast'},

  // eBay: written feedback on collectibles sold in this store, plus general
  // feedback about shipping and service (product left out when it is not a
  // collectible). eBay positive feedback has no star value; it is shown as 5.
  {source: 'ebay', author: '9***l', rating: 5, text: 'Ship on time as described package great', when: 'Past 6 months', product: 'GreenLight USPS LLV with Mailbox 1:64', handle: 'usps-llv-with-mailbox-1-64-greenlight-hobby-exclusive'},
  {source: 'ebay', author: '2***4', rating: 5, text: 'Very nice, and great detail.', when: 'Past 6 months', product: 'GreenLight USPS LLV with Mailbox 1:64', handle: 'usps-llv-with-mailbox-1-64-greenlight-hobby-exclusive'},
  {source: 'ebay', author: '5***-', rating: 5, text: 'Came on time and as described.', when: 'Past 6 months', product: 'Funko Pop! Tsunade Sannin #2105', handle: 'funko-pop-tsunade-sannin-2105-naruto-shippuden'},
  {source: 'ebay', author: 'n***y', rating: 5, text: 'Item was as described and shipped super fast. A+++', when: 'Past 6 months', product: 'Funko Pop! Johnny Cage #1958', handle: 'funko-pop-johnny-cage-1958-mortal-kombat-ii-2026'},
  {source: 'ebay', author: 'a***h', rating: 5, text: 'Good item! Arrived as agreed! Good transaction!', when: 'Past 6 months', product: 'Funko Pop! Johnny Cage #1958', handle: 'funko-pop-johnny-cage-1958-mortal-kombat-ii-2026'},
  {source: 'ebay', author: '1***x', rating: 5, text: 'Great deal, Fast Shipping, Response fast to any questions A A A+ + +', when: 'Past 6 months', product: 'Ultra PRO card display case'},
  {source: 'ebay', author: 't***y', rating: 5, text: "Fastest Shipping I've seen. Arrived Well Packaged. Just as described. Thanks", when: 'Past year', product: 'eBay order'},
  {source: 'ebay', author: 'u***c', rating: 5, text: 'Seller shipped quickly and item arrived with good packaging. Item works as described.', when: 'Past 6 months', product: 'eBay order'},
];

export function reviewsForHandle(handle: string) {
  return EXTERNAL_REVIEWS.filter((review) => review.handle === handle);
}

export function writtenReviews() {
  return EXTERNAL_REVIEWS.filter((review) => review.text);
}
