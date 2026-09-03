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

function normalizeProduct(product) {
  if (!product) return null;

  const variants =
    product.variants?.edges?.map((edge) => ({
      ...edge.node,
      quantityAvailable: edge.node.quantityAvailable ?? 0,
      isOutOfStock:
        !edge.node.availableForSale || (edge.node.quantityAvailable ?? 0) <= 0,
    })) || [];

  const selectedVariant = variants[0] || null;

  const hasAvailableVariant = variants.some((variant) => variant.availableForSale);

  const totalQuantityAvailable = variants.reduce(
    (total, variant) => total + (variant.quantityAvailable || 0),
    0
  );

  return {
    ...product,
    variants,
    selectedVariant,
    quantityAvailable: totalQuantityAvailable,
    availableForSale: product.availableForSale && hasAvailableVariant,
    isOutOfStock:
      !product.availableForSale ||
      !hasAvailableVariant ||
      totalQuantityAvailable <= 0,
  };
}

function normalizeCollection(collection) {
  if (!collection) return null;

  return {
    ...collection,
    image: collection.image || null,
    productCount: collection.products?.edges?.length || 0,
  };
}

function getMetaobjectField(fields = [], key) {
  return fields.find((field) => field.key === key) || null;
}

function normalizeCollectibleBrand(metaobject) {
  if (!metaobject) return null;

  const brandNameField = getMetaobjectField(
    metaobject.fields,
    "brand_name"
  );
  const shopifyTagField = getMetaobjectField(
    metaobject.fields,
    "shopify_tag"
  );
  const logoField = getMetaobjectField(metaobject.fields, "logo");
  const logoImage = logoField?.reference?.image || null;

  if (!brandNameField?.value || !shopifyTagField?.value) {
    return null;
  }

  return {
    id: metaobject.id,
    handle: metaobject.handle,
    name: brandNameField.value,
    shopifyTag: shopifyTagField.value,
    logo: logoImage
      ? {
          url: logoImage.url,
          altText: logoImage.altText || `${brandNameField.value} logo`,
          width: logoImage.width || null,
          height: logoImage.height || null,
        }
      : null,
  };
}

function normalizeVehicleMake(metaobject) {
  if (!metaobject) return null;

  const makeNameField = getMetaobjectField(metaobject.fields, "make_name");
  const shopifyTagField = getMetaobjectField(
    metaobject.fields,
    "shopify_tag"
  );
  const logoField = getMetaobjectField(metaobject.fields, "logo");
  const logoImage = logoField?.reference?.image || null;

  if (!makeNameField?.value || !shopifyTagField?.value) {
    return null;
  }

  return {
    id: metaobject.id,
    handle: metaobject.handle,
    name: makeNameField.value,
    shopifyTag: shopifyTagField.value,
    logo: logoImage
      ? {
          url: logoImage.url,
          altText: logoImage.altText || `${makeNameField.value} logo`,
          width: logoImage.width || null,
          height: logoImage.height || null,
        }
      : null,
  };
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
  compareAtPriceRange {
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
        quantityAvailable
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

const collectionFields = `
  id
  title
  handle
  description
  image {
    url
    altText
  }
  products(first: 1) {
    edges {
      node {
        id
      }
    }
  }
`;

export async function getProducts() {
  const query = `
    {
      products(first: 100, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            ${productFields}
          }
        }
      }
    }
  `;

  const data = await shopifyFetch(query);

  return data?.products?.edges?.map((item) => normalizeProduct(item.node)) || [];
}

export async function getCollections() {
  const query = `
    {
      collections(first: 50) {
        edges {
          node {
            ${collectionFields}
          }
        }
      }
    }
  `;

  const data = await shopifyFetch(query);

  return (
    data?.collections?.edges
      ?.map((item) => normalizeCollection(item.node))
      ?.filter((collection) => collection && collection.handle !== "frontpage") || []
  );
}

export async function getCollectibleBrands() {
  const query = `
    query getCollectibleBrands {
      metaobjects(type: "collectible_brand", first: 100) {
        edges {
          node {
            id
            handle
            fields {
              key
              value
              reference {
                ... on MediaImage {
                  image {
                    url
                    altText
                    width
                    height
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch(query);

  return (
    data?.metaobjects?.edges
      ?.map((item) => normalizeCollectibleBrand(item.node))
      ?.filter(Boolean) || []
  );
}

export async function getVehicleMakes() {
  const query = `
    query getVehicleMakes {
      metaobjects(type: "vehicle_make", first: 100) {
        edges {
          node {
            id
            handle
            fields {
              key
              value
              reference {
                ... on MediaImage {
                  image {
                    url
                    altText
                    width
                    height
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch(query);

  return (
    data?.metaobjects?.edges
      ?.map((item) => normalizeVehicleMake(item.node))
      ?.filter(Boolean) || []
  );
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

  const products =
    data?.collection?.products?.edges?.map((item) =>
      normalizeProduct(item.node)
    ) || [];

  return {
    collection: data?.collection || null,
    products: products.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      return dateB - dateA;
    }),
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

  return normalizeProduct(data?.product || null);
}

export async function getVariantById(variantId) {
  const query = `
    query getVariantById($id: ID!) {
      node(id: $id) {
        ... on ProductVariant {
          id
          title
          availableForSale
          quantityAvailable
          product {
            id
            title
            handle
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
        }
      }
    }
  `;

  const data = await shopifyFetch(query, { id: variantId });
  return data?.node || null;
}

async function validateVariantStock(variantId, quantity = 1) {
  const variant = await getVariantById(variantId);

  if (!variant) {
    console.error("Variant not found.");
    return false;
  }

  if (!variant.availableForSale || (variant.quantityAvailable ?? 0) < quantity) {
    console.error("Product is out of stock or requested quantity is unavailable.");
    return false;
  }

  return true;
}

export async function createCart(variantId, quantity = 1) {
  const hasStock = await validateVariantStock(variantId, quantity);

  if (!hasStock) {
    return {
      error: true,
      message: "This product is currently out of stock.",
    };
  }

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
  const hasStock = await validateVariantStock(variantId, quantity);

  if (!hasStock) {
    return {
      error: true,
      message: "This product is currently out of stock.",
    };
  }

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
                  availableForSale
                  quantityAvailable
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
                  compareAtPrice {
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
                    availableForSale
                    quantityAvailable
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
                    compareAtPrice {
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
                    availableForSale
                    quantityAvailable
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
                    compareAtPrice {
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