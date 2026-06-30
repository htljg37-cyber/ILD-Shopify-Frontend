import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getCookie(req: VercelRequest, name: string) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());

  const found = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.split('=')[1]) : null;
}

async function getCustomer(req: VercelRequest) {
  const accessToken = getCookie(req, 'shopify_customer_access_token');

  if (!accessToken) return null;

  const discoveryResponse = await fetch(
    'https://account.ildistributions.com/.well-known/customer-account-api'
  );

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

  if (!response.ok) return null;

  const data = await response.json();

  if (data.errors) return null;

  return data.data.customer;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const customer = await getCustomer(req);

  if (!customer?.id) {
    return res.status(401).json({
      success: false,
      items: [],
      error: 'Customer not authenticated.',
    });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return res.status(500).json({
      success: false,
      items: [],
      error: 'Missing Supabase environment variables.',
    });
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey);

  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('shopify_customer_id', customer.id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({
      success: false,
      items: [],
      error: error.message,
    });
  }

  return res.status(200).json({
    success: true,
    items: data || [],
  });
}