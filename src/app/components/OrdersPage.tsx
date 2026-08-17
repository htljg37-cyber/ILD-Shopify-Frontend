import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';

type OrderItem = {
  title: string;
  quantity: number;
  image: string | null;
  imageAlt: string;
};

type Order = {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string | null;
  shipmentStatus?: string | null;
  totalPrice: string;
  currencyCode: string;
  statusUrl?: string | null;
  items?: OrderItem[];
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  carrier?: string | null;
};

function formatDate(date?: string) {
  if (!date) return 'Date unavailable';

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMoney(amount: string, currencyCode: string) {
  return `${Number(amount || 0).toFixed(2)} ${currencyCode || 'USD'}`;
}

function normalizeStatus(status?: string | null) {
  if (!status) return 'Pending';

  return status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getShippingStatus(order: Order) {
  const shipmentStatus = order.shipmentStatus?.toUpperCase();

  switch (shipmentStatus) {
    case 'DELIVERED':
      return 'Order delivered';

    case 'OUT_FOR_DELIVERY':
      return 'Out for delivery';

    case 'IN_TRANSIT':
    case 'CARRIER_PICKED_UP':
      return 'In transit';

    case 'DELAYED':
      return 'Shipment delayed';

    case 'ATTEMPTED_DELIVERY':
      return 'Delivery attempted';

    case 'READY_FOR_PICKUP':
      return 'Ready for pickup';

    case 'PICKED_UP':
      return 'Order picked up';

    case 'FAILURE':
      return 'Delivery issue';

    case 'CONFIRMED':
    case 'LABEL_PRINTED':
    case 'LABEL_PURCHASED':
      return 'Order shipped';

    default:
      return order.fulfillmentStatus?.toUpperCase() === 'FULFILLED'
        ? 'Order shipped'
        : 'Preparing shipment';
  }
}

function getOrderStep(order: Order) {
  const fulfillment = order.fulfillmentStatus?.toUpperCase() || '';
  const financial = order.financialStatus?.toUpperCase() || '';

  if (fulfillment.includes('FULFILLED')) return 4;
  if (fulfillment.includes('PARTIAL')) return 3;
  if (financial.includes('PAID')) return 2;

  return 1;
}

function StatusPill({
  label,
  type = 'neutral',
}: {
  label: string;
  type?: 'success' | 'warning' | 'neutral';
}) {
  const styles = {
    success: 'bg-[#0F5A46]/10 text-[#0F5A46] border-[#0F5A46]/15',
    warning: 'bg-[#C8A45D]/14 text-[#8A6824] border-[#C8A45D]/20',
    neutral: 'bg-[#111111]/6 text-[#717182] border-[#EAE7DF]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] ${styles[type]}`}
    >
      {label}
    </span>
  );
}

function OrderProgress({
  step,
  shipmentStatus,
}: {
  step: number;
  shipmentStatus?: string | null;
}) {
  const delivered =
    shipmentStatus?.toUpperCase() === 'DELIVERED';

  const steps = [
    { label: 'Placed', icon: ShoppingBag },
    { label: 'Paid', icon: CreditCard },
    { label: 'Preparing', icon: Package },
    {
      label: delivered ? 'Delivered' : 'Shipped',
      icon: Truck,
    },
  ];

  return (
    <div className="rounded-2xl bg-[#F8F7F3] p-4">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((item, index) => {
          const Icon = item.icon;
          const active = index + 1 <= step;

          return (
            <div key={item.label} className="text-center">
              <div
                className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${
                  active
                    ? 'bg-[#0F5A46] text-white shadow-[0_10px_24px_rgba(15,90,70,0.20)]'
                    : 'bg-white text-[#717182]'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <p
                className={`text-xs font-bold ${
                  active ? 'text-[#0F5A46]' : 'text-[#717182]'
                }`}
              >
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch('/api/customer/orders');
        const data = await response.json();

        if (data?.success) {
          setOrders(data.orders || []);
        }
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(a.processedAt || 0).getTime();
      const dateB = new Date(b.processedAt || 0).getTime();

      return dateB - dateA;
    });
  }, [orders]);

  if (loading) {
    return (
      <section className="bg-[#FAFAFA] py-16">
        <div className="container mx-auto px-4 text-center md:px-6">
          <p className="font-semibold text-[#717182]">Loading your orders...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[linear-gradient(180deg,#FAFAFA_0%,#F6F4EF_100%)] py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-10">
          <span className="inline-flex rounded-full bg-[#0F5A46]/10 px-4 py-2 text-sm font-bold text-[#0F5A46]">
            IL Distributions LLC
          </span>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#111111] md:text-5xl">
            My Orders
          </h2>

          <p className="mt-3 max-w-2xl text-[#717182]">
            Review your purchase history, payment status, shipping details, and
            tracking information.
          </p>
        </div>

        {sortedOrders.length === 0 ? (
          <div className="rounded-3xl border border-[#EAE7DF] bg-white p-12 text-center shadow-sm md:p-16">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F5A46]/10">
              <Package className="h-9 w-9 text-[#0F5A46]" />
            </div>

            <h3 className="text-2xl font-extrabold text-[#111111]">
              No orders yet
            </h3>

            <p className="mx-auto mt-3 max-w-md text-[#717182]">
              Once you complete your first purchase, your orders will appear here.
            </p>

            <a
              href="/catalog"
              className="mt-8 inline-flex rounded-xl bg-[#0F5A46] px-8 py-3 font-bold text-white shadow-[0_12px_28px_rgba(15,90,70,0.22)] transition hover:bg-[#126B54]"
            >
              Continue Shopping
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedOrders.map((order) => {
              const step = getOrderStep(order);
              const paymentPaid =
                order.financialStatus?.toUpperCase() === 'PAID';
              const fulfilled =
                order.fulfillmentStatus?.toUpperCase() === 'FULFILLED';

              const shippingStatus = getShippingStatus(order);

              const hasTracking = Boolean(
                order.trackingNumber || order.trackingUrl
              );
              const items = order.items || [];
              
              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-3xl border border-[#EAE7DF] bg-white shadow-[0_14px_36px_rgba(17,17,17,0.05)]"
                >
                  <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between md:p-7">
                    <div className="flex gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0F5A46]/10">
                        <PackageCheck className="h-7 w-7 text-[#0F5A46]" />
                      </div>

                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <h3 className="text-2xl font-extrabold text-[#111111]">
                            Order {order.name}
                          </h3>

                          <StatusPill
                            label={shippingStatus}
                            type={
                              ['DELAYED', 'ATTEMPTED_DELIVERY', 'FAILURE'].includes(
                                order.shipmentStatus?.toUpperCase() || ''
                              )
                                ? 'warning'
                                : fulfilled
                                  ? 'success'
                                  : 'warning'
                            }
                          />
                        </div>

                        <p className="text-sm font-semibold text-[#717182]">
                          Placed on {formatDate(order.processedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#F8F7F3] p-4 text-left md:min-w-[220px] md:text-right">
                      <p className="text-2xl font-extrabold text-[#111111]">
                        ${formatMoney(order.totalPrice, order.currencyCode)}
                      </p>

                      <div className="mt-3 space-y-1 text-sm text-[#717182]">
                        <p>
                          Payment:{' '}
                          <span className="font-bold text-[#111111]">
                            {normalizeStatus(order.financialStatus)}
                          </span>
                        </p>

                        <p>
                          Fulfillment:{' '}
                          <span className="font-bold text-[#111111]">
                            {normalizeStatus(order.fulfillmentStatus)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {items.length > 0 && (
                    <div className="border-t border-[#EAE7DF] px-6 py-5 md:px-7">
                      <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#0F5A46]">
                        Items in this order
                      </p>

                      <div className="grid gap-3 md:grid-cols-2">
                        {items.map((item, index) => (
                          <div
                            key={`${item.title}-${index}`}
                            className="flex items-center gap-4 rounded-2xl border border-[#EAE7DF] bg-[#F8F7F3] p-3"
                          >
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.imageAlt}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Package className="h-6 w-6 text-[#0F5A46]" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="line-clamp-2 font-bold text-[#111111]">
                                {item.title}
                              </p>

                              <p className="mt-1 text-sm font-semibold text-[#717182]">
                                Qty: {item.quantity}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-[#EAE7DF] px-6 py-6 md:px-7">
                    <OrderProgress
                      step={step}
                      shipmentStatus={order.shipmentStatus}
                    />

                    <div className="mt-6 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-[#EAE7DF] bg-white p-4">
                        <div className="mb-2 flex items-center gap-2 text-[#0F5A46]">
                          <CheckCircle2 className="h-4 w-4" />
                          <p className="text-xs font-extrabold uppercase tracking-[0.16em]">
                            Payment
                          </p>
                        </div>

                        <p className="font-bold text-[#111111]">
                          {paymentPaid ? 'Payment confirmed' : 'Payment pending'}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#EAE7DF] bg-white p-4">
                        <div className="mb-2 flex items-center gap-2 text-[#0F5A46]">
                          <Clock className="h-4 w-4" />
                          <p className="text-xs font-extrabold uppercase tracking-[0.16em]">
                            Status
                          </p>
                        </div>

                        <p className="font-bold text-[#111111]">
                          {shippingStatus}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#EAE7DF] bg-white p-4">
                        <div className="mb-2 flex items-center gap-2 text-[#0F5A46]">
                          <Truck className="h-4 w-4" />
                          <p className="text-xs font-extrabold uppercase tracking-[0.16em]">
                            Tracking
                          </p>
                        </div>

                        {hasTracking ? (
                          <div className="space-y-1">
                            <p className="font-bold text-[#111111]">
                              {order.carrier || 'Carrier'}:{' '}
                              {order.trackingNumber}
                            </p>

                            {order.trackingUrl && (
                              <a
                                href={order.trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-sm font-bold text-[#0F5A46] hover:text-[#C8A45D]"
                              >
                                Track package
                                <ExternalLink className="ml-1 h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <p className="font-bold text-[#111111]">
                            {fulfilled
                              ? 'Tracking not available yet'
                              : 'Not shipped yet'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {order.trackingUrl ? (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-xl bg-[#0F5A46] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,90,70,0.20)] transition hover:bg-[#126B54]"
                        >
                          Track Package
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      ) : (
                        <a
                          href="/track-order"
                          className="inline-flex items-center rounded-xl bg-[#0F5A46] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,90,70,0.20)] transition hover:bg-[#126B54]"
                        >
                          Track Order
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      )}

                      <a
                        href="/contact"
                        className="inline-flex items-center rounded-xl border border-[#EAE7DF] bg-white px-5 py-3 text-sm font-bold text-[#111111] transition hover:bg-[#F5F5F5] hover:text-[#0F5A46]"
                      >
                        Need Help?
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}