import type { VercelRequest, VercelResponse } from '@vercel/node';

function clearCookie(name: string) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const siteUrl = process.env.SITE_URL || 'https://ildistributions.com';

  res.setHeader('Set-Cookie', [
    clearCookie('shopify_customer_access_token'),
    clearCookie('shopify_customer_id_token'),
    clearCookie('shopify_auth_state'),
    clearCookie('shopify_code_verifier'),
  ]);

  return res.redirect(302, `${siteUrl}/account`);
}