import type { VercelRequest, VercelResponse } from '@vercel/node';

function getCookie(req: VercelRequest, name: string) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());

  const found = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.split('=')[1]) : null;
}

function createCookie(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(
    value
  )}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearCookie(name: string) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = typeof req.query.code === 'string' ? req.query.code : null;
  const state = typeof req.query.state === 'string' ? req.query.state : null;

  const savedState = getCookie(req, 'shopify_auth_state');
  const codeVerifier = getCookie(req, 'shopify_code_verifier');

  const clientId = process.env.SHOPIFY_CUSTOMER_CLIENT_ID;
  const tokenUrl = process.env.SHOPIFY_CUSTOMER_TOKEN_URL;
  const callbackUrl = process.env.SHOPIFY_CUSTOMER_CALLBACK;
  const siteUrl = process.env.SITE_URL || 'https://ildistributions.com';

  if (!code || !state || !savedState || !codeVerifier) {
    return res.status(400).json({ error: 'Missing authentication data.' });
  }

  if (state !== savedState) {
    return res.status(400).json({ error: 'Invalid authentication state.' });
  }

  if (!clientId || !tokenUrl || !callbackUrl) {
    return res.status(500).json({
      error: 'Missing Shopify Customer Account API environment variables.',
    });
  }

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: callbackUrl,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    return res.status(500).json({
      error: 'Failed to exchange authorization code.',
      details: errorText,
    });
  }

  const tokenData = await tokenResponse.json();

  res.setHeader('Set-Cookie', [
    createCookie('shopify_customer_access_token', tokenData.access_token, 3600),
    createCookie('shopify_customer_id_token', tokenData.id_token || '', 3600),
    clearCookie('shopify_auth_state'),
    clearCookie('shopify_code_verifier'),
  ]);

  return res.redirect(302, `${siteUrl}/account`);
}