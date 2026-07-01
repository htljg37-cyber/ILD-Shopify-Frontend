import type { VercelRequest, VercelResponse } from '@vercel/node';

function getCookie(req: VercelRequest, name: string) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const found = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  return found ? decodeURIComponent(found.split('=')[1]) : null;
}

async function getCustomerOrders(req: VercelRequest) {
  const accessToken = getCookie(req, 'shopify_customer_access_token');

  if (!accessToken) {
    return null;
  }

  const discoveryResponse = await fetch(
    'https://account.ildistributions.com/.well-known/customer-account-api'
  );

  const apiConfig = await discoveryResponse.json();

  const query = `
    query CustomerOrders {
      customer {
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              name
              processedAt
              financialStatus
              fulfillmentStatus
              statusUrl
              totalPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(apiConfig.graphql_api, {
    method: 'POST',
    headers: {
      Authorization: accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (data.errors || !data.data?.customer) {
    return null;
  }

  return data.data.customer.orders.edges.map((edge: any) => {
    const order = edge.node;

    return {
      id: order.id,
      name: order.name,
      processedAt: order.processedAt,
      financialStatus: order.financialStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      totalPrice: order.totalPrice?.amount || '0.00',
      currencyCode: order.totalPrice?.currencyCode || 'USD',
      statusUrl: order.statusUrl,
    };
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed.',
    });
  }

  const orders = await getCustomerOrders(req);

  if (!orders) {
    return res.status(401).json({
      success: false,
      orders: [],
      error: 'Customer not authenticated or orders unavailable.',
    });
  }

  return res.status(200).json({
    success: true,
    orders,
  });
}