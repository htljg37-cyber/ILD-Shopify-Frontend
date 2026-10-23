import type { VercelRequest, VercelResponse } from '@vercel/node';

// Serves /product/:handle with the product's own <title>, meta description,
// Open Graph/Twitter tags, canonical URL and Product structured data already
// in the HTML, so Google and social previews see the product instead of the
// generic store title. The React app then boots normally on top of it.

const SITE_URL = (process.env.SITE_URL || 'https://www.ildistributions.com').replace(/\/$/, '');
const API_VERSION = '2024-10';

const PRODUCT_SEO_QUERY = `
  query ProductSeo($handle: String!) {
    product(handle: $handle) {
      title
      handle
      vendor
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

async function loadIndexHtml(req: VercelRequest) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const response = await fetch(`${proto}://${host}/index.html`);
  if (!response.ok) throw new Error(`index.html ${response.status}`);
  return response.text();
}

async function loadProduct(handle: string) {
  const domain = process.env.VITE_SHOPIFY_STORE_DOMAIN;
  const token = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
  if (!domain || !token) return null;

  const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query: PRODUCT_SEO_QUERY, variables: { handle } }),
  });
  if (!response.ok) return null;
  const json = await response.json();
  return json?.data?.product || null;
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
    brand: product.vendor ? { '@type': 'Brand', name: product.vendor } : undefined,
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
        }
      : undefined,
  };

  const extraHead = [
    `<link rel="canonical" href="${u}" />`,
    `<meta property="product:price:amount" content="${price ? escapeHtml(String(price.amount)) : ''}" />`,
    `<meta property="product:price:currency" content="${price ? escapeHtml(price.currencyCode) : ''}" />`,
    `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ');

  return out.replace('</head>', `    ${extraHead}\n  </head>`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const handle = String(req.query.handle || '').replace(/[^a-z0-9-]/gi, '');

  let html: string;
  try {
    html = await loadIndexHtml(req);
  } catch {
    res.status(500).send('Unable to load page');
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  try {
    const product = handle ? await loadProduct(handle) : null;
    if (product) {
      html = injectSeo(html, product, `${SITE_URL}/product/${product.handle}`);
      // Cache at the edge for 10 minutes, serve stale while refreshing.
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
    } else {
      res.setHeader('Cache-Control', 'public, s-maxage=60');
    }
  } catch {
    // On any error fall back to the plain app shell so the page still works.
    res.setHeader('Cache-Control', 'public, s-maxage=60');
  }

  res.status(200).send(html);
}
