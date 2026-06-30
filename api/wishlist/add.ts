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

  const query = `
    query Customer {
      customer {
        id
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

  if (!response.ok) return null;

  const data = await response.json();

  if (data.errors) return null;

  return data.data.customer;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed.',
    });
  }

  const customer = await getCustomer(req);

  if (!customer?.id) {
    return res.status(401).json({
      success: false,
      error: 'Customer not authenticated.',
    });
  }

  const {
    product_id,
    variant_id,
    handle,
    title,
    image_url,
    price,
  } = req.body || {};

  if (!product_id || !handle || !title) {
    return res.status(400).json({
      success: false,
      error: 'Missing required product data.',
    });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return res.status(500).json({
      success: false,
      error: 'Missing Supabase environment variables.',
    });
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey);

  const { data, error } = await supabase
    .from('wishlist_items')
    .upsert(
      {
        shopify_customer_id: customer.id,
        product_id,
        variant_id: variant_id || null,
        handle,
        title,
        image_url: image_url || null,
        price: price || null,
      },
      {
        onConflict: 'shopify_customer_id,product_id',
      }
    )
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }

  return res.status(200).json({
    success: true,
    item: data,
  });
}