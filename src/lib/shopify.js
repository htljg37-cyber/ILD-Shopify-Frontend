const domain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
const token = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;

async function shopifyFetch(query, variables = {}) {
  if (!domain || !token) {
    console.error(
      "Missing Shopify environment variables. Check VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_TOKEN in your .env file."
    );
    return null;
  }

  try {
    const response = await fetch(`https://${domain}/api/2024-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      console.error("Shopify request failed:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.errors) {
      console.error("Shopify errors:", data.errors);
      return null;
    }

    return data.data;
  } catch (error) {
    console.error("Shopify fetch error:", error);
    return null;
  }
}

const productFields = `
  id
  title
  handle
  tags
  createdAt
  description
  descriptionHtml
  availableForSale
  featuredImage {
    url
    altText
  }
  images(first: 10) {
    edges {
      node {
        url
        altText
      }
    }
  }
  priceRange {
    minVariantPrice {
      amount
      currencyCode
    }
  }
  variants(first: 10) {
    edges {
      node {
        id
        title
        availableForSale
        price {
          amount
          currencyCode
        }
      }
    }
  }
`;

export async function getProducts() {
  const query = `
    {
      products(first: 100) {
        edges {
          node {
            ${productFields}
          }
        }
      }
    }
  `;

  const data = await shopifyFetch(query);
  return data?.products?.edges?.map((item) => item.node) || [];
}

export async function getProductsByCollection(handle) {
  const query = `
    query getCollectionProducts($handle: String!) {
      collection(handle: $handle) {
        id
        title
        description
        products(first: 50) {
          edges {
            node {
              ${productFields}
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch(query, { handle });

  return {
    collection: data?.collection || null,
    products: data?.collection?.products?.edges?.map((item) => item.node) || [],
  };
}

export async function getProductByHandle(handle) {
  const query = `
    query getProductByHandle($handle: String!) {
      product(handle: $handle) {
        ${productFields}
      }
    }
  `;

  const data = await shopifyFetch(query, { handle });

  return data?.product || null;
}

export async function createCart(variantId, quantity = 1) {
  const query = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
          totalQuantity
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      lines: [
        {
          merchandiseId: variantId,
          quantity,
        },
      ],
    },
  };

  const data = await shopifyFetch(query, variables);

  if (data?.cartCreate?.userErrors?.length) {
    console.error("Cart errors:", data.cartCreate.userErrors);
    return null;
  }

  return data?.cartCreate?.cart || null;
}

export async function addToCart(cartId, variantId, quantity = 1) {
  const query = `
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          totalQuantity
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    cartId,
    lines: [
      {
        merchandiseId: variantId,
        quantity,
      },
    ],
  };

  const data = await shopifyFetch(query, variables);

  if (data?.cartLinesAdd?.userErrors?.length) {
    console.error("Add to cart errors:", data.cartLinesAdd.userErrors);
    return null;
  }

  return data?.cartLinesAdd?.cart || null;
}

export async function getCart(cartId) {
  const query = `
    query getCart($cartId: ID!) {
      cart(id: $cartId) {
        id
        checkoutUrl
        totalQuantity
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
        }
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    title
                    handle
                    featuredImage {
                      url
                    }
                  }
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch(query, { cartId });

  return data?.cart || null;
}

export async function updateCartLine(cartId, lineId, quantity) {
  const query = `
    mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost {
            subtotalAmount {
              amount
              currencyCode
            }
          }
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                cost {
                  totalAmount {
                    amount
                    currencyCode
                  }
                }
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                      handle
                      featuredImage {
                        url
                      }
                    }
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch(query, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });

  if (data?.cartLinesUpdate?.userErrors?.length) {
    console.error("Update cart errors:", data.cartLinesUpdate.userErrors);
    return null;
  }

  return data?.cartLinesUpdate?.cart || null;
}

export async function removeCartLine(cartId, lineId) {
  const query = `
    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost {
            subtotalAmount {
              amount
              currencyCode
            }
          }
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                cost {
                  totalAmount {
                    amount
                    currencyCode
                  }
                }
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                      handle
                      featuredImage {
                        url
                      }
                    }
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch(query, {
    cartId,
    lineIds: [lineId],
  });

  if (data?.cartLinesRemove?.userErrors?.length) {
    console.error("Remove cart errors:", data.cartLinesRemove.userErrors);
    return null;
  }

  return data?.cartLinesRemove?.cart || null;
}