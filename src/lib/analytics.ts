type GtagItem = {
  item_id?: string;
  item_name?: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function sendEvent(
  eventName: string,
  params: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', eventName, params);
}

export function trackViewItem(
  item: GtagItem,
  currency = 'USD'
): void {
  sendEvent('view_item', {
    currency,
    value: item.price ?? 0,
    items: [
      {
        ...item,
        quantity: item.quantity ?? 1,
      },
    ],
  });
}

export function trackAddToCart(
  item: GtagItem,
  currency = 'USD'
): void {
  sendEvent('add_to_cart', {
    currency,
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [
      {
        ...item,
        quantity: item.quantity ?? 1,
      },
    ],
  });
}

export function trackBeginCheckout(
  items: GtagItem[],
  value: number,
  currency = 'USD'
): void {
  sendEvent('begin_checkout', {
    currency,
    value,
    items,
  });
}

export function trackPurchase(
  transactionId: string,
  items: GtagItem[],
  value: number,
  currency = 'USD',
  shipping = 0,
  tax = 0
): void {
  sendEvent('purchase', {
    transaction_id: transactionId,
    currency,
    value,
    shipping,
    tax,
    items,
  });
}