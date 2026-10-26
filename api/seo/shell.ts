import type { VercelRequest, VercelResponse } from '@vercel/node';
import { addNoindex, loadIndexHtml } from './_shell';

// Serves the app for routes Google should not index:
//   mode=notfound -> any URL the site does not have: real 404 + noindex, so
//                    Google stops reporting it as a "soft 404". Visitors still
//                    get the store (the app shows its home page).
//   mode=private  -> cart, wishlist, orders, account, track order: 200 but
//                    noindex, since they are empty or personal for Google.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const mode = req.query.mode === 'private' ? 'private' : 'notfound';

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
  res.status(mode === 'private' ? 200 : 404).send(addNoindex(html));
}
