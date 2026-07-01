import type { VercelRequest, VercelResponse } from '@vercel/node';

function clearCookie(name: string) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Set-Cookie', [
    clearCookie('shopify_customer_access_token'),
    clearCookie('shopify_customer_refresh_token'),
    clearCookie('shopify_customer_id_token'),
    clearCookie('shopify_auth_state'),
    clearCookie('shopify_code_verifier'),
  ]);

  return res.redirect(302, '/');
}