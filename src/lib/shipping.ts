export function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export function getShippingLabel(product: any) {
  const tags = product?.tags || [];

  if (tags.includes('shipping_local_free')) {
    return 'Free Local Delivery';
  }

  const localDeliveryTag = tags.find((tag: string) =>
    tag.startsWith('shipping_local_')
  );

  if (localDeliveryTag) {
    const rawAmount = localDeliveryTag.replace('shipping_local_', '');
    const amount = Number(rawAmount) / 100;

    if (!Number.isNaN(amount)) {
      return `${formatMoney(amount)} local delivery`;
    }
  }

  if (tags.includes('shipping_local')) {
    return 'Local Delivery Only';
  }

  if (tags.includes('shipping_free')) {
    return 'Free Shipping';
  }

  const usFlatRateTag = tags.find((tag: string) =>
    tag.startsWith('shipping_us_')
  );

  if (usFlatRateTag) {
    const rawAmount = usFlatRateTag.replace('shipping_us_', '');
    const amount = Number(rawAmount) / 100;

    if (!Number.isNaN(amount)) {
      return `${formatMoney(amount)} shipping across the U.S.`;
    }
  }

  const shippingFromTag = tags.find((tag: string) =>
    tag.startsWith('shipping_from_')
  );

  if (shippingFromTag) {
    const rawAmount = shippingFromTag.replace('shipping_from_', '');
    const amount = Number(rawAmount) / 100;

    if (!Number.isNaN(amount)) {
      return `Shipping from ${formatMoney(amount)}`;
    }
  }

  if (tags.includes('shipping_calculated')) {
    return 'Shipping calculated at checkout';
  }

  return 'Shipping calculated at checkout';
}