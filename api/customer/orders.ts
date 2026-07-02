import type { VercelRequest, VercelResponse } from '@vercel/node';

function getCookie(req: VercelRequest, name: string) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const found = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  return found ? decodeURIComponent(found.split('=')[1]) : null;
}

async function getCustomerApiEndpoint() {
  const discoveryResponse = await fetch(
    'https://account.ildistributions.com/.well-known/customer-account-api'
  );

  if (!discoveryResponse.ok) return null;

  const apiConfig = await discoveryResponse.json();
  return apiConfig.graphql_api;
}

async function fetchCustomerOrders(graphqlEndpoint: string, accessToken: string) {
  const query = `
    query CustomerOrders {
      customer {
        orders(first: 20) {
          edges {
            node {
              id
              name
              processedAt
              financialStatus
              fulfillmentStatus
              totalPrice {
                amount
                currencyCode
              }
              lineItems(first: 10) {
                edges {
                  node {
                    title
                    quantity
                    image {
                      url
                      altText
                    }
                  }
                }
              }
              successfulFulfillments(first: 10) {
                trackingInfo {
                  number
                  url
                  company
                }
              }
            }
          }
        }
      }
    }
  `;

  return fetch(graphqlEndpoint, {
    method: 'POST',
    headers: {
      Authorization: accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
}

async function fetchCustomerOrdersBasic(
  graphqlEndpoint: string,
  accessToken: string
) {
  const query = `
    query CustomerOrders {
      customer {
        orders(first: 20) {
          edges {
            node {
              id
              name
              processedAt
              financialStatus
              fulfillmentStatus
              totalPrice {
                amount
                currencyCode
              }
              lineItems(first: 10) {
                edges {
                  node {
                    title
                    quantity
                    image {
                      url
                      altText
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  return fetch(graphqlEndpoint, {
    method: 'POST',
    headers: {
      Authorization: accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
}

function mapOrders(data: any) {
  return (
    data?.data?.customer?.orders?.edges?.map((edge: any) => {
      const order = edge.node;

      const items =
        order.lineItems?.edges?.map((itemEdge: any) => {
          const item = itemEdge.node;

          return {
            title: item.title || 'Product',
            quantity: item.quantity || 1,
            image: item.image?.url || null,
            imageAlt: item.image?.altText || item.title || 'Product image',
          };
        }) || [];

      const firstTracking =
  order.successfulFulfillments
    ?.flatMap((fulfillment: any) => fulfillment.trackingInfo || [])
    ?.find((tracking: any) => tracking?.number || tracking?.url) || null;

      return {
        id: order.id,
        name: order.name,
        processedAt: order.processedAt,
        financialStatus: order.financialStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        totalPrice: order.totalPrice?.amount || '0.00',
        currencyCode: order.totalPrice?.currencyCode || 'USD',
        items,
        trackingNumber: firstTracking?.number || null,
        trackingUrl: firstTracking?.url || null,
        carrier: firstTracking?.company || null,
        statusUrl: null,
      };
    }) || []
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const accessToken = getCookie(req, 'shopify_customer_access_token');

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      orders: [],
      reason: 'missing_access_token_cookie',
    });
  }

  try {
    const graphqlEndpoint = await getCustomerApiEndpoint();

    if (!graphqlEndpoint) {
      return res.status(500).json({
        success: false,
        orders: [],
        reason: 'failed_customer_api_discovery',
      });
    }

    let response = await fetchCustomerOrders(graphqlEndpoint, accessToken);
    let data = await response.json();

    if (!response.ok || data.errors) {
      response = await fetchCustomerOrdersBasic(graphqlEndpoint, accessToken);
      data = await response.json();
    }

    if (!response.ok || data.errors) {
      return res.status(401).json({
        success: false,
        orders: [],
        reason: 'customer_orders_request_failed',
        errors: data.errors || null,
      });
    }

    return res.status(200).json({
      success: true,
      orders: mapOrders(data),
    });
  } catch {
    return res.status(500).json({
      success: false,
      orders: [],
      reason: 'unexpected_error',
    });
  }
}