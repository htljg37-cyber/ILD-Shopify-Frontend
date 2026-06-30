import type { VercelRequest, VercelResponse } from '@vercel/node';

function getCookie(req: VercelRequest, name: string) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());

  const found = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.split('=')[1]) : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const accessToken = getCookie(req, 'shopify_customer_access_token');

  if (!accessToken) {
    return res.status(401).json({
      isLoggedIn: false,
      customer: null,
    });
  }

  const query = `
    query Customer {
      customer {
        id
        firstName
        lastName
        emailAddress {
          emailAddress
        }
      }
    }
  `;

  const response = await fetch('https://account.ildistributions.com/api/2025-01/graphql.json', {
    method: 'POST',
    headers: {
      Authorization: accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    return res.status(401).json({
      isLoggedIn: false,
      customer: null,
    });
  }

  const data = await response.json();

  return res.status(200).json({
    isLoggedIn: true,
    customer: data.data.customer,
  });
}