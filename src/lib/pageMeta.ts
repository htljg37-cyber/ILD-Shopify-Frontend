// Title and meta description for each fixed page. Used in two places so they
// always match: the SEO function writes them into the HTML that Google reads
// (api/seo/product.ts), and the app sets document.title on client-side
// navigation (App.tsx).

export type PageMeta = {title: string; description: string};

export const DEFAULT_META: PageMeta = {
  title: 'IL Distributions LLC | Online Store',
  description:
    'Shop curated diecast models, collectibles, and premium products from IL Distributions LLC.',
};

export const PAGE_META: Record<string, PageMeta> = {
  about: {
    title: 'About IL Distributions | Family-Run Collectibles Store',
    description:
      'Meet IL Distributions, a family-run store in Southern California selling new diecast cars, anime figures, Funko Pops and preserved roses since 2023.',
  },
  catalog: {
    title: 'Shop All Diecast Cars, Figures & Collectibles | ILD',
    description:
      'Browse the full IL Distributions catalog: diecast model cars, anime figures, Funko Pops, model kits, dioramas and preserved roses. Brand new, shipped with tracking.',
  },
  'new-arrivals': {
    title: 'New Arrivals: Latest Diecast & Collectibles | ILD',
    description:
      'See the newest diecast models, anime figures and collectibles added to IL Distributions.',
  },
  collections: {
    title: 'Collections: Diecast, Figures, Model Kits & More | ILD',
    description:
      'Shop IL Distributions by collection: diecast and model cars, collectible figures, model kits, dioramas and display cases, preserved roses and apparel.',
  },
  brands: {
    title: 'Shop by Brand: Jada, Maisto, MINI GT, Funko & More | ILD',
    description:
      'Find collectibles by brand at IL Distributions, including Jada, Maisto, MiJo Exclusives, MINI GT, Bburago, Funko, Banpresto and Bandai.',
  },
  contact: {
    title: 'Contact IL Distributions | Customer Support',
    description:
      'Questions about a product or order? Email support@ildistributions.com. We usually reply within 24 hours.',
  },
  'shipping-policy': {
    title: 'Shipping Policy | IL Distributions',
    description: 'How IL Distributions ships orders within the United States, with tracking on every shipment.',
  },
  'returns-policy': {
    title: 'Returns Policy | IL Distributions',
    description: 'Return and refund policy for orders placed at IL Distributions.',
  },
  'privacy-policy': {
    title: 'Privacy Policy | IL Distributions',
    description: 'How IL Distributions collects, uses and protects your information.',
  },
  'terms-of-service': {
    title: 'Terms of Service | IL Distributions',
    description: 'Terms of service for shopping at IL Distributions.',
  },
};

export function metaForPath(path: string): PageMeta {
  const key = path.replace(/^\/+|\/+$/g, '');
  return PAGE_META[key] || DEFAULT_META;
}
