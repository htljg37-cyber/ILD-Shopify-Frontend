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
      reason: 'missing_access_token_cookie',
    });
  }

  try {
    const discoveryResponse = await fetch(
      'https://account.ildistributions.com/.well-known/customer-account-api'
    );

    if (!discoveryResponse.ok) {
      return res.status(500).json({
        isLoggedIn: false,
        customer: null,
        reason: 'failed_customer_api_discovery',
      });
    }

    const apiConfig = await discoveryResponse.json();
    const graphqlEndpoint = apiConfig.graphql_api;

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

    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        Authorization: accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (!response.ok || data.errors) {
      return res.status(401).json({
        isLoggedIn: false,
        customer: null,
        reason: 'customer_api_request_failed',
        errors: data.errors || null,
      });
    }

    return res.status(200).json({
      isLoggedIn: true,
      customer: data.data.customer,
    });
  } catch (error) {
    return res.status(500).json({
      isLoggedIn: false,
      customer: null,
      reason: 'unexpected_error',
    });
  }
}