import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

function base64Url(buffer: Buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function createCookie(name: string, value: string, maxAge = 600) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.SHOPIFY_CUSTOMER_CLIENT_ID;
  const authUrl = process.env.SHOPIFY_CUSTOMER_AUTH_URL;
  const callbackUrl = process.env.SHOPIFY_CUSTOMER_CALLBACK;

  if (!clientId || !authUrl || !callbackUrl) {
    return res.status(500).json({
      error: 'Missing Shopify Customer Account API environment variables.',
    });
  }

  const state = base64Url(crypto.randomBytes(32));
  const codeVerifier = base64Url(crypto.randomBytes(64));

  const codeChallenge = base64Url(
    crypto.createHash('sha256').update(codeVerifier).digest()
  );

  const redirectUrl = new URL(authUrl);

  redirectUrl.searchParams.set('client_id', clientId);
  redirectUrl.searchParams.set('response_type', 'code');
  redirectUrl.searchParams.set('redirect_uri', callbackUrl);
  redirectUrl.searchParams.set('scope', 'openid email customer-account-api:full');
  redirectUrl.searchParams.set('state', state);
  redirectUrl.searchParams.set('code_challenge', codeChallenge);
  redirectUrl.searchParams.set('code_challenge_method', 'S256');

  res.setHeader('Set-Cookie', [
    createCookie('shopify_auth_state', state),
    createCookie('shopify_code_verifier', codeVerifier),
  ]);

  return res.redirect(302, redirectUrl.toString());
}