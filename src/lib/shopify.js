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







function normalizeVariant(variant) {
  if (!variant) return null;

  const quantityAvailable = variant.quantityAvailable ?? 0;

  return {
    ...variant,
    quantityAvailable,
    selectedOptions: Array.isArray(variant.selectedOptions)
      ? variant.selectedOptions
      : [],
    image: variant.image || null,
    isOutOfStock:
      !variant.availableForSale || quantityAvailable <= 0,
  };
}

function getVariantHintFromAltText(altText = '') {
  if (typeof altText !== 'string') return '';

  const match = altText.match(/\|\s*variant\s*:\s*([^|]+)\s*$/i);
  return match?.[1]?.trim() || '';
}

function stripVariantHintFromAltText(altText = '') {
  if (typeof altText !== 'string') return altText || '';

  return altText.replace(/\s*\|\s*variant\s*:\s*[^|]+\s*$/i, '').trim();
}

function normalizeProduct(product) {
  if (!product) return null;

  const variants =
    product.variants?.edges
      ?.map((edge) => normalizeVariant(edge.node))
      .filter(Boolean) || [];

  const shopifySelectedVariant = normalizeVariant(
    product.selectedOrFirstAvailableVariant
  );

  const selectedVariant =
    variants.find((variant) => variant.id === shopifySelectedVariant?.id) ||
    shopifySelectedVariant ||
    variants.find((variant) => !variant.isOutOfStock) ||
    variants[0] ||
    null;

  const hasAvailableVariant =
    Boolean(shopifySelectedVariant && !shopifySelectedVariant.isOutOfStock) ||
    variants.some((variant) => !variant.isOutOfStock);

  const totalQuantityAvailable = variants.reduce(
    (total, variant) => total + (variant.quantityAvailable || 0),
    0
  );

  const normalizedImageEdges =
    product.images?.edges?.map((edge) => {
      const node = edge?.node || null;
      if (!node) return edge;

      const variantHint = getVariantHintFromAltText(node.altText);

      return {
        ...edge,
        node: {
          ...node,
          altText: stripVariantHintFromAltText(node.altText),
          variantHint,
        },
      };
    }) || [];

  const normalizedImages = product.images
    ? {
        ...product.images,
        edges: normalizedImageEdges,
      }
    : product.images;

  // Build an exact image -> variant map only when the image uniquely belongs
  // to one variant. Shopify can fall back to the product image when a variant
  // has no dedicated image, so duplicate image keys are intentionally ignored.
  const imageVariantCandidates = new Map();

  for (const variant of variants) {
    const keys = [variant.image?.id, variant.image?.url].filter(Boolean);

    for (const key of keys) {
      if (!imageVariantCandidates.has(key)) {
        imageVariantCandidates.set(key, new Set());
      }

      imageVariantCandidates.get(key).add(variant.id);
    }
  }

  if (
    shopifySelectedVariant?.id &&
    !variants.some((variant) => variant.id === shopifySelectedVariant.id)
  ) {
    const keys = [
      shopifySelectedVariant.image?.id,
      shopifySelectedVariant.image?.url,
    ].filter(Boolean);

    for (const key of keys) {
      if (!imageVariantCandidates.has(key)) {
        imageVariantCandidates.set(key, new Set());
      }

      imageVariantCandidates.get(key).add(shopifySelectedVariant.id);
    }
  }

  const imageVariantMap = {};

  for (const [key, variantIds] of imageVariantCandidates.entries()) {
    if (variantIds.size === 1) {
      imageVariantMap[key] = [...variantIds][0];
    }
  }

  const originalFeaturedImage = product.featuredImage || null;
  const firstGalleryImage = normalizedImageEdges[0]?.node || null;
  const displayImage =
    selectedVariant?.image || originalFeaturedImage || firstGalleryImage || null;

  return {
    ...product,
    images: normalizedImages,
    variants,
    options: Array.isArray(product.options) ? product.options : [],
    selectedOrFirstAvailableVariant: shopifySelectedVariant,
    selectedVariant,
    displayVariant: selectedVariant,
    originalFeaturedImage,
    featuredImage: displayImage,
    displayImage,
    displayPrice:
      selectedVariant?.price || product.priceRange?.minVariantPrice || null,
    displayCompareAtPrice:
      selectedVariant?.compareAtPrice ||
      product.compareAtPriceRange?.minVariantPrice ||
      null,
    imageVariantMap,
    quantityAvailable: totalQuantityAvailable,
    availableForSale: Boolean(product.availableForSale && hasAvailableVariant),
    isOutOfStock: !product.availableForSale || !hasAvailableVariant,
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
    id
    url
    altText
  }

  images(first: 10) {
    edges {
      node {
        id
        url
        altText
      }
    }
  }

  options {
    id
    name
    values
  }

  selectedOrFirstAvailableVariant {
    id
    title
    availableForSale
    quantityAvailable
    selectedOptions {
      name
      value
    }
    image {
      id
      url
      altText
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
        selectedOptions {
          name
          value
        }
        image {
          id
          url
          altText
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

// Product detail pages can contain many images and variants. Collection/list
// requests keep the smaller connections to avoid unnecessary payload.
const productDetailFields = `${productFields
  .replace('images(first: 10)', 'images(first: 250)')
  .replace('variants(first: 10)', 'variants(first: 250)')}
  seo {
    title
    description
  }
`;



// List cards do not need full descriptions or the complete image gallery.
const productCardFields = `
  id
  title
  handle
  tags
  createdAt
  availableForSale

  featuredImage {
    id
    url
    altText
  }

  selectedOrFirstAvailableVariant {
    id
    title
    availableForSale
    quantityAvailable
    selectedOptions {
      name
      value
    }
    image {
      id
      url
      altText
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







// Only simultaneous list requests are shared; prices and stock are not cached.



const pendingProductPages = new Map();







/**



 * Fetch one lightweight page. Pass pageInfo.endCursor as `after` for the next.



 * `query` is Shopify search syntax, not a raw user search string.



 */



export async function getProductsPage({



  first = 20,



  after = null,



  query = '',



  sortKey = 'CREATED_AT',



  reverse = true,



} = {}) {



  if (!Number.isInteger(first) || first < 1 || first > 250) {



    throw new RangeError('Product page size must be between 1 and 250.');



  }



  const variables = {first, after, query, sortKey, reverse};



  const key = JSON.stringify(variables);



  const existing = pendingProductPages.get(key);



  if (existing) return existing;







  const request = (async () => {



    const document = `



      query ProductCardsPage(



        $first: Int!, $after: String, $query: String,



        $sortKey: ProductSortKeys!, $reverse: Boolean!



      ) {



        products(



          first: $first, after: $after, query: $query,



          sortKey: $sortKey, reverse: $reverse



        ) {



          edges { node { ${productCardFields} } }



          pageInfo { hasNextPage hasPreviousPage startCursor endCursor }



        }



      }



    `;



    const data = await shopifyFetch(document, variables);



    if (!data?.products) throw new Error('Unable to load product page.');



    return {



      products: data.products.edges.map((edge) => normalizeProduct(edge.node)),



      pageInfo: data.products.pageInfo,



    };



  })();







  pendingProductPages.set(key, request);



  try {



    return await request;



  } finally {



    pendingProductPages.delete(key);



  }



}







// Compatibility for existing components that expect an array.



// Migrate each screen to getProductsPage before removing this temporary limit.



export async function getProducts() {



  try {



    const {products} = await getProductsPage({first: 200});



    return products;



  } catch (error) {



    console.error('Unable to load products:', error);



    return [];



  }



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



        ${productDetailFields}



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
          selectedOptions {
            name
            value
          }
          image {
            id
            url
            altText
          }
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
  return normalizeVariant(data?.node || null);
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







export async function createCart(variantId, quantity = 1, attributes = []) {



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

      ...(attributes.length ? { attributes } : {}),



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



// Index used for exact numbered pages and the existing client-side filters.



// No image URLs, descriptions, variant prices or compare-at prices are fetched.



export async function getCatalogIndex() {



  const document = `



    query CatalogIndex($after: String) {



      products(first: 250, after: $after, sortKey: CREATED_AT, reverse: true) {



        edges {



          node {



            id title tags createdAt availableForSale



            priceRange { minVariantPrice { amount } }



            selectedOrFirstAvailableVariant {

              id

              availableForSale

              quantityAvailable

            }



            variants(first: 10) {



              edges { node { id availableForSale quantityAvailable } }



            }



          }



        }



        pageInfo { hasNextPage endCursor }



      }



    }



  `;



  const products = [];



  const seen = new Set();



  let after = null;



  while (true) {



    const data = await shopifyFetch(document, {after});



    if (!data?.products) throw new Error('Unable to load catalog index.');



    for (const edge of data.products.edges) {



      if (!seen.has(edge.node.id)) {



        seen.add(edge.node.id);



        products.push(normalizeProduct(edge.node));



      }



    }



    const {hasNextPage, endCursor} = data.products.pageInfo;



    if (!hasNextPage) return products;



    if (!endCursor || endCursor === after) {



      throw new Error('Unable to advance catalog index.');



    }



    after = endCursor;



  }



}







export async function getProductCardsByIds(ids) {



  if (!Array.isArray(ids) || ids.length > 250) {



    throw new RangeError('Expected at most 250 product IDs.');



  }



  if (!ids.length) return [];



  const document = `



    query CatalogPageCards($ids: [ID!]!) {



      nodes(ids: $ids) { ... on Product { ${productCardFields} } }



    }



  `;



  const data = await shopifyFetch(document, {ids});



  if (!data?.nodes) throw new Error('Unable to load catalog cards.');



  const byId = new Map();



  for (const node of data.nodes) {



    if (node) byId.set(node.id, normalizeProduct(node));



  }



  // Keep the order selected by the catalog, including price ordering.



  return ids.map((id) => byId.get(id)).filter(Boolean);



}



export async function getBrandProductIndex() {



  const document = `



    query BrandProductIndex($after: String) {



      products(first: 250, after: $after, sortKey: ID) {



        edges { node { id tags } }



        pageInfo { hasNextPage endCursor }



      }



    }



  `;



  const products = [];



  const seen = new Set();



  let after = null;



  while (true) {



    const data = await shopifyFetch(document, {after});



    if (!data?.products) throw new Error('Unable to load brand products.');



    for (const {node} of data.products.edges) {



      if (!seen.has(node.id)) {



        seen.add(node.id);



        products.push(node);



      }



    }



    const {hasNextPage, endCursor} = data.products.pageInfo;



    if (!hasNextPage) return products;



    if (!endCursor || endCursor === after) {



      throw new Error('Unable to advance brand products.');



    }



    after = endCursor;



  }



}







export async function getCollectionCatalogIndex(handle) {



  const document = `



    query CollectionCatalogIndex($handle: String!, $after: String) {



      collection(handle: $handle) {



        products(first: 250, after: $after, sortKey: ID) {



          edges {



            node {



              id title tags createdAt availableForSale



              priceRange { minVariantPrice { amount } }



              selectedOrFirstAvailableVariant {

                id

                availableForSale

                quantityAvailable

              }



              variants(first: 10) {



                edges { node { id availableForSale quantityAvailable } }



              }



            }



          }



          pageInfo { hasNextPage endCursor }



        }



      }



    }



  `;



  const products = [];



  const seen = new Set();



  let after = null;



  while (true) {



    const data = await shopifyFetch(document, {handle, after});



    if (!data) throw new Error('Unable to load collection products.');



    if (!data.collection) return [];



    const connection = data.collection.products;



    if (!connection) throw new Error('Unable to load collection products.');



    for (const {node} of connection.edges) {



      if (!seen.has(node.id)) {



        seen.add(node.id);



        products.push(normalizeProduct(node));



      }



    }



    const {hasNextPage, endCursor} = connection.pageInfo;



    if (!hasNextPage) return products;



    if (!endCursor || endCursor === after) {



      throw new Error('Unable to advance collection products.');



    }



    after = endCursor;



  }



}