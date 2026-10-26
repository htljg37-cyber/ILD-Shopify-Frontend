import type { VercelRequest } from '@vercel/node';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Shared helpers for the SEO functions. Files starting with "_" are not
// deployed as their own endpoints.

// The built app shell is bundled with this function (see "includeFiles" in
// vercel.json) and read from disk. Fetching it over HTTP from the same host is
// only a fallback: on protected preview deployments that request receives
// Vercel's login page instead of the store.
let cachedIndexHtml: string | null = null;

function isAppShell(html: string) {
  return html.includes('id="root"');
}

export async function loadIndexHtml(req: VercelRequest) {
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

export function addNoindex(html: string) {
  if (html.includes('name="robots"')) return html;
  return html.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>');
}
