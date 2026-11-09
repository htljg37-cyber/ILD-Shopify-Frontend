import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Serves /product/:handle with the product's own <title>, meta description,
// Open Graph/Twitter tags, canonical URL and Product structured data already
// in the HTML, so Google and social previews see the product instead of the
// generic store title. The React app then boots normally on top of it.

// The live site answers on www, so canonical and sitemap URLs must use www
// too; a bare-domain SITE_URL would point Google at a redirect.
const SITE_URL = (process.env.SITE_URL || 'https://www.ildistributions.com')
  .replace(/\/$/, '')
  .replace('://ildistributions.com', '://www.ildistributions.com');
const API_VERSION = '2024-10';

const PRODUCT_SEO_QUERY = `
  query ProductSeo($handle: String!) {
    product(handle: $handle) {
      title
      handle
      vendor
      tags
      description
      availableForSale
      seo { title description }
      featuredImage { url altText }
      priceRange { minVariantPrice { amount currencyCode } }
      selectedOrFirstAvailableVariant { sku barcode }
    }
  }
`;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(value: string, max: number) {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

// The built app shell is bundled with this function (see "includeFiles" in
// vercel.json) and read from disk. Fetching it over HTTP from the same host is
// only a fallback: on protected preview deployments that request receives
// Vercel's login page instead of the store.
let cachedIndexHtml: string | null = null;

function isAppShell(html: string) {
  return html.includes('id="root"');
}

async function loadIndexHtml(req: VercelRequest) {
  if (cachedIndexHtml) return cachedIndexHtml;

  for (const file of [
    join(process.cwd(), 'dist', 'index.html'),
    join(process.cwd(), 'index.html'),
  ]) {
    try {
      const html = await readFile(file, 'utf8');
      // The source index.html (pointing at /src/main.tsx) is not the built shell.
      if (isAppShell(html) && !html.includes('/src/main.tsx')) {
        cachedIndexHtml = html;
        return html;
      }
    } catch {
      // try the next location
    }
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const response = await fetch(`${proto}://${host}/index.html`);
  const html = await response.text();
  if (!response.ok || !isAppShell(html)) {
    throw new Error('Built index.html not available');
  }
  return html;
}

// The app shell (index.html) carries the home page canonical. Every other
// page must replace it with its own URL, or Google reads it as a duplicate
// of the home page.
const CANONICAL_RE = /<link\s+rel="canonical"[^>]*>/;

function setCanonical(html: string, url: string) {
  const tag = `<link rel="canonical" href="${url}" />`;
  return CANONICAL_RE.test(html)
    ? html.replace(CANONICAL_RE, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
}

function removeCanonical(html: string) {
  return html.replace(CANONICAL_RE, '');
}

function addNoindex(html: string) {
  if (html.includes('name="robots"')) return html;
  return html.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>');
}

async function loadProduct(handle: string) {
  const domain = process.env.VITE_SHOPIFY_STORE_DOMAIN;
  const token = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
  if (!domain || !token) throw new Error('Missing Shopify environment variables');

  const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query: PRODUCT_SEO_QUERY, variables: { handle } }),
  });
  if (!response.ok) throw new Error(`Storefront API ${response.status}`);
  const json = await response.json();
  if (json?.errors?.length || !json?.data) throw new Error('Storefront API error');
  // null here means Shopify has no product with this handle.
  return json.data.product || null;
}

const BRAND_NAMES: Record<string, string> = {
  'mini gt': 'MINI GT',
  'funko pop!': 'Funko',
  sega: 'SEGA',
  furyu: 'FuRyu',
  'mijo exclusives': 'MiJo Exclusives',
};

// Products store the manufacturer as a "brand_<Name>" tag (any capitalization
// of the prefix). Use it for structured data; fall back to the store itself.
function getBrand(product: any) {
  const tag = (product.tags || []).find((t: string) => /^brand_/i.test(t));
  if (tag) {
    const raw = tag.replace(/^brand_/i, '').replace(/_/g, ' ').trim();
    const known = BRAND_NAMES[raw.toLowerCase()];
    if (known) return known;
    if (raw && raw === raw.toLowerCase()) {
      return raw.replace(/\b\w/g, (c: string) => c.toUpperCase());
    }
    if (raw) return raw;
  }
  if (product.vendor && product.vendor !== 'Printify') return product.vendor;
  return 'IL Distributions LLC';
}

// Return policy shown on /returns-policy: 30 days from delivery, customer
// pays return shipping (unless the item arrived damaged/defective/incorrect).
const RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'US',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 30,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/ReturnShippingFees',
};

// Mirrors src/lib/shipping.ts so Google gets the same shipping cost the
// product page shows. Returns null when the page itself has no fixed US
// rate (local-delivery-only items, or "calculated at checkout").
function getUsShippingRate(tags: string[]): number | null {
  if (tags.some((tag) => tag.startsWith('shipping_local'))) return null;
  if (tags.includes('shipping_free')) return 0;
  const flat = tags.find((tag) => tag.startsWith('shipping_us_'));
  if (flat) {
    const amount = Number(flat.replace('shipping_us_', '')) / 100;
    if (!Number.isNaN(amount)) return amount;
  }
  return null;
}

// delivery_<min>_<max> is the total estimate the page shows ("3-7 business
// days"). Google adds handling + transit, so split it to keep the same total.
function getDeliveryTime(tags: string[]) {
  for (const tag of tags) {
    const match = tag.trim().match(/^delivery_(\d{1,2})_(\d{1,2})$/i);
    if (!match) continue;
    const min = Number(match[1]);
    const max = Number(match[2]);
    if (!min || !max || max < min) continue;
    return {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: min,
        maxValue: Math.max(min, max - 1),
        unitCode: 'DAY',
      },
    };
  }
  return undefined;
}

function getShippingDetails(product: any) {
  const tags: string[] = (product.tags || []).filter((tag: unknown) => typeof tag === 'string');
  const rate = getUsShippingRate(tags);
  if (rate === null) return undefined;
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: rate.toFixed(2), currency: 'USD' },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' },
    deliveryTime: getDeliveryTime(tags),
  };
}

function replaceTag(html: string, pattern: RegExp, replacement: string) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function injectSeo(html: string, product: any, url: string) {
  const title = product.seo?.title || `${product.title} | ILD`;
  const description = truncate(
    product.seo?.description || product.description || product.title,
    160
  );
  const image = product.featuredImage?.url || `${SITE_URL}/logo2.png`;
  const price = product.priceRange?.minVariantPrice;

  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const img = escapeHtml(image);
  const u = escapeHtml(url);

  let out = html;
  out = replaceTag(out, /<title>[\s\S]*?<\/title>/, `<title>${t}</title>`);
  out = replaceTag(out, /<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${d}" />`);
  out = replaceTag(out, /<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${t}" />`);
  out = replaceTag(out, /<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${d}" />`);
  out = replaceTag(out, /<meta\s+property="og:image"[\s\S]*?\/>/, `<meta property="og:image" content="${img}" />`);
  out = replaceTag(out, /<meta\s+property="og:type"[\s\S]*?\/>/, `<meta property="og:type" content="product" />`);
  out = replaceTag(out, /<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${u}" />`);
  out = replaceTag(out, /<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${t}" />`);
  out = replaceTag(out, /<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${d}" />`);
  out = replaceTag(out, /<meta\s+name="twitter:image"[\s\S]*?\/>/, `<meta name="twitter:image" content="${img}" />`);

  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    description,
    image: [image],
    url,
    brand: { '@type': 'Brand', name: getBrand(product) },
    sku: product.selectedOrFirstAvailableVariant?.sku || undefined,
    gtin: product.selectedOrFirstAvailableVariant?.barcode || undefined,
    offers: price
      ? {
          '@type': 'Offer',
          url,
          price: Number(price.amount).toFixed(2),
          priceCurrency: price.currencyCode,
          availability: product.availableForSale
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          shippingDetails: getShippingDetails(product),
          hasMerchantReturnPolicy: RETURN_POLICY,
        }
      : undefined,
  };

  out = setCanonical(out, u);

  const extraHead = [
    `<meta property="product:price:amount" content="${price ? escapeHtml(String(price.amount)) : ''}" />`,
    `<meta property="product:price:currency" content="${price ? escapeHtml(price.currencyCode) : ''}" />`,
    `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ');

  return out.replace('</head>', `    ${extraHead}\n  </head>`);
}

// ---------------------------------------------------------------------------
// /sitemap.xml (mode=sitemap). Lives in this function because the Vercel
// Hobby plan allows at most 12 functions and all 12 are in use.

const STATIC_PATHS = [
  '/',
  '/catalog',
  '/new-arrivals',
  '/collections',
  '/brands',
  '/about',
  '/contact',
  '/shipping-policy',
  '/returns-policy',
  '/privacy-policy',
  '/terms-of-service',
];

const SITEMAP_QUERY = `
  query SitemapPage($productCursor: String, $collectionCursor: String, $withCollections: Boolean!) {
    products(first: 250, after: $productCursor) {
      pageInfo { hasNextPage endCursor }
      nodes { handle updatedAt }
    }
    collections(first: 250, after: $collectionCursor) @include(if: $withCollections) {
      pageInfo { hasNextPage endCursor }
      nodes { handle updatedAt }
    }
  }
`;

async function storefront(query: string, variables: Record<string, unknown>) {
  const domain = process.env.VITE_SHOPIFY_STORE_DOMAIN;
  const token = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
  if (!domain || !token) throw new Error('Missing Shopify environment variables');
  const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`Storefront API ${response.status}`);
  const json = await response.json();
  if (json?.errors?.length || !json?.data) throw new Error('Storefront API error');
  return json.data;
}

type SitemapEntry = { loc: string; lastmod?: string };

async function loadSitemapEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = STATIC_PATHS.map((path) => ({ loc: `${SITE_URL}${path}` }));
  let productCursor: string | null = null;
  let collectionCursor: string | null = null;
  let moreProducts = true;
  let moreCollections = true;

  // At most 20 pages (5,000 products) as a safety stop.
  for (let page = 0; page < 20 && (moreProducts || moreCollections); page += 1) {
    const data = await storefront(SITEMAP_QUERY, {
      productCursor,
      collectionCursor,
      withCollections: moreCollections,
    });

    if (moreProducts) {
      for (const node of data.products.nodes) {
        entries.push({ loc: `${SITE_URL}/product/${node.handle}`, lastmod: node.updatedAt });
      }
      moreProducts = data.products.pageInfo.hasNextPage;
      productCursor = data.products.pageInfo.endCursor;
    }

    if (moreCollections && data.collections) {
      for (const node of data.collections.nodes) {
        // /collections/all is redirected to /catalog, so it is not listed.
        if (node.handle === 'all') continue;
        entries.push({ loc: `${SITE_URL}/collections/${node.handle}`, lastmod: node.updatedAt });
      }
      moreCollections = data.collections.pageInfo.hasNextPage;
      collectionCursor = data.collections.pageInfo.endCursor;
    } else {
      moreCollections = false;
    }
  }

  return entries;
}

function buildSitemapXml(entries: SitemapEntry[]) {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${escapeHtml(entry.lastmod.slice(0, 10))}</lastmod>` : '';
      return `  <url><loc>${escapeHtml(entry.loc)}</loc>${lastmod}</url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function serveSitemap(res: VercelResponse) {
  try {
    const xml = buildSitemapXml(await loadSitemapEntries());
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).send('Sitemap temporarily unavailable');
  }
}

// ---------------------------------------------------------------------------
// /feeds/google-supplemental.tsv (mode=gmcfeed). A supplemental data source
// for Google Merchant Center: Google & YouTube sends the SEO title and SEO
// description, so this feed replaces them with the product's real title and
// full description, sets the real manufacturer as brand, and adds gender and
// age group to apparel. Merchant Center fetches it once a day, so new
// products are picked up without editing anything by hand.

const FEED_QUERY = `
  query FeedPage($cursor: String) {
    products(first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        title
        vendor
        productType
        tags
        description
        variants(first: 100) { nodes { id title } }
      }
    }
  }
`;

function numericId(gid: string) {
  return gid.split('/').pop() || '';
}

function feedText(value: string) {
  return value.replace(/[\t\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function isApparel(product: any) {
  return product.productType === 'Apparel & Streetwear' || product.vendor === 'Printify';
}

async function serveGmcFeed(res: VercelResponse) {
  try {
    const lines = [['id', 'title', 'description', 'brand', 'gender', 'age_group'].join('\t')];
    let cursor: string | null = null;
    for (let page = 0; page < 50; page += 1) {
      const data = await storefront(FEED_QUERY, { cursor });
      for (const product of data.products.nodes) {
        const productId = numericId(product.id);
        const description = feedText(product.description || product.title).slice(0, 5000);
        const apparel = isApparel(product);
        for (const variant of product.variants.nodes) {
          const variantTitle = variant.title && variant.title !== 'Default Title' ? ` - ${variant.title}` : '';
          lines.push(
            [
              `shopify_ZZ_${productId}_${numericId(variant.id)}`,
              feedText(`${product.title}${variantTitle}`).slice(0, 150),
              description,
              feedText(getBrand(product)),
              apparel ? 'unisex' : '',
              apparel ? 'adult' : '',
            ].join('\t')
          );
        }
      }
      if (!data.products.pageInfo.hasNextPage) break;
      cursor = data.products.pageInfo.endCursor;
    }
    res.setHeader('Content-Type', 'text/tab-separated-values; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(`${lines.join('\n')}\n`);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).send('Feed temporarily unavailable');
  }
}

// Same text as src/lib/pageMeta.ts (kept here because the serverless
// function cannot import files from src/ at runtime). Update both together.
const PAGE_META: Record<string, {title: string; description: string}> = {
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

// mode=page -> fixed pages such as /about or /catalog: the app shell with that
// page's own title, description, Open Graph tags and canonical URL.
async function servePage(req: VercelRequest, res: VercelResponse, page: string) {
  let html: string;
  try {
    html = await loadIndexHtml(req);
  } catch {
    res.status(500).send('Unable to load page');
    return;
  }
  const meta = PAGE_META[page];
  if (meta) {
    const t = escapeHtml(meta.title);
    const d = escapeHtml(meta.description);
    const u = escapeHtml(`${SITE_URL}/${page}`);
    html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${t}</title>`);
    html = replaceTag(html, /<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${d}" />`);
    html = replaceTag(html, /<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${t}" />`);
    html = replaceTag(html, /<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${d}" />`);
    html = replaceTag(html, /<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${u}" />`);
    html = replaceTag(html, /<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${t}" />`);
    html = replaceTag(html, /<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${d}" />`);
    html = setCanonical(html, u);
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  res.status(200).send(html);
}

// mode=collection -> /collections/:handle with the collection's own title,
// description and canonical URL. Before this, every collection page was
// served as the bare home page shell (same title, no canonical), so Google
// reported them as duplicates. A collection Shopify does not have gets a
// real 404 instead of an empty page ("soft 404").
const COLLECTION_SEO_QUERY = `
  query CollectionSeo($handle: String!) {
    collection(handle: $handle) {
      title
      handle
      description
      seo { title description }
      image { url }
    }
  }
`;

async function serveCollection(req: VercelRequest, res: VercelResponse, handle: string) {
  let html: string;
  try {
    html = await loadIndexHtml(req);
  } catch {
    res.status(500).send('Unable to load page');
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  let collection: any;
  try {
    collection = handle ? (await storefront(COLLECTION_SEO_QUERY, { handle })).collection : null;
  } catch {
    // Shopify could not be reached: serve the page so visitors still get it.
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    res.status(200).send(setCanonical(html, escapeHtml(`${SITE_URL}/collections/${handle}`)));
    return;
  }

  if (!collection) {
    res.setHeader('X-Robots-Tag', 'noindex');
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    res.status(404).send(addNoindex(removeCanonical(html)));
    return;
  }

  const t = escapeHtml(collection.seo?.title || `${collection.title} | ILD`);
  const d = escapeHtml(
    truncate(
      collection.seo?.description ||
        collection.description ||
        `Shop ${collection.title} at IL Distributions. Brand new collectibles shipped with tracking.`,
      160
    )
  );
  const u = escapeHtml(`${SITE_URL}/collections/${collection.handle}`);
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${t}</title>`);
  html = replaceTag(html, /<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${d}" />`);
  html = replaceTag(html, /<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${t}" />`);
  html = replaceTag(html, /<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${d}" />`);
  html = replaceTag(html, /<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${u}" />`);
  html = replaceTag(html, /<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${t}" />`);
  html = replaceTag(html, /<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${d}" />`);
  if (collection.image?.url) {
    const img = escapeHtml(collection.image.url);
    html = replaceTag(html, /<meta\s+property="og:image"[\s\S]*?\/>/, `<meta property="og:image" content="${img}" />`);
    html = replaceTag(html, /<meta\s+name="twitter:image"[\s\S]*?\/>/, `<meta name="twitter:image" content="${img}" />`);
  }
  html = setCanonical(html, u);

  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  res.status(200).send(html);
}

// Also serves routes Google should not index (kept in this same function
// because the Vercel Hobby plan allows at most 12 functions per deployment):
//   mode=notfound -> any URL the site does not have: real 404 + noindex.
//                    Visitors still get the store (the app shows its home page).
//   mode=private  -> cart, wishlist, orders, account, track order: 200 + noindex.
async function serveShell(req: VercelRequest, res: VercelResponse, mode: string) {
  let html: string;
  try {
    html = await loadIndexHtml(req);
  } catch {
    res.status(500).send('Unable to load page');
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  res.status(mode === 'private' ? 200 : 404).send(addNoindex(removeCanonical(html)));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const mode = String(req.query.mode || '');
  if (mode === 'sitemap') {
    await serveSitemap(res);
    return;
  }
  if (mode === 'gmcfeed') {
    await serveGmcFeed(res);
    return;
  }
  if (mode === 'page') {
    await servePage(req, res, String(req.query.page || '').replace(/[^a-z-]/g, ''));
    return;
  }
  if (mode === 'collection') {
    await serveCollection(req, res, String(req.query.handle || '').replace(/[^a-z0-9-]/gi, ''));
    return;
  }
  if (mode === 'notfound' || mode === 'private') {
    await serveShell(req, res, mode);
    return;
  }

  const handle = String(req.query.handle || '').replace(/[^a-z0-9-]/gi, '');

  let html: string;
  try {
    html = await loadIndexHtml(req);
  } catch {
    res.status(500).send('Unable to load page');
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  let status = 200;
  try {
    const product = handle ? await loadProduct(handle) : null;
    if (product) {
      html = injectSeo(html, product, `${SITE_URL}/product/${product.handle}`);
      // Cache at the edge for 10 minutes, serve stale while refreshing.
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
    } else {
      // The product does not exist (deleted, renamed or mistyped URL): answer
      // with a real 404 so Google drops it instead of reporting a "soft 404".
      status = 404;
      html = addNoindex(removeCanonical(html));
      res.setHeader('Cache-Control', 'public, s-maxage=300');
    }
  } catch {
    // Shopify could not be reached: serve the normal page so it still works.
    res.setHeader('Cache-Control', 'public, s-maxage=60');
  }

  res.status(status).send(html);
}
