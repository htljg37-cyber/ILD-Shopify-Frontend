import {memo, useEffect, useMemo, useState} from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  LogIn,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';

const shopifyAuthLoginUrl = 'https://www.ildistributions.com/api/auth/login';

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

async function readJsonResponse(response: Response) {
  const responseText = await response.text();
  if (!responseText.trim()) return null;

  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
}

function getOptimizedImageUrl(url?: string | null) {
  if (!url) return '';

  try {
    const nextUrl = new URL(url);
    if (nextUrl.hostname.includes('cdn.shopify.com')) {
      nextUrl.searchParams.set('width', '160');
    }
    return nextUrl.toString();
  } catch {
    return url;
  }
}

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
  switch (order.shipmentStatus?.toUpperCase()) {
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
    success: 'border-[#0F5A46]/15 bg-[#0F5A46]/10 text-[#0F5A46]',
    warning: 'border-[#C8A45D]/20 bg-[#C8A45D]/14 text-[#8A6824]',
    neutral: 'border-[#D7DDD8] bg-[#EEF1EE] text-[#68756E]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${styles[type]}`}
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
  const delivered = shipmentStatus?.toUpperCase() === 'DELIVERED';
  const steps = [
    {label: 'Placed', icon: ShoppingBag},
    {label: 'Paid', icon: CreditCard},
    {label: 'Preparing', icon: Package},
    {label: delivered ? 'Delivered' : 'Shipped', icon: Truck},
  ];

  return (
    <div className="rounded-2xl border border-[#D7DDD8] bg-[#EEF2EF] p-4">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((item, index) => {
          const Icon = item.icon;
          const active = index + 1 <= step;

          return (
            <div key={item.label} className="text-center">
              <div
                className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${
                  active
                    ? 'bg-[#0F5A46] text-white'
                    : 'border border-[#D7DDD8] bg-white text-[#7A867F]'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <p
                className={`text-xs font-bold ${
                  active ? 'text-[#0F5A46]' : 'text-[#7A867F]'
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

const OrderCard = memo(function OrderCard({order}: {order: Order}) {
  const step = getOrderStep(order);
  const paymentPaid = order.financialStatus?.toUpperCase() === 'PAID';
  const fulfilled = order.fulfillmentStatus?.toUpperCase() === 'FULFILLED';
  const shippingStatus = getShippingStatus(order);
  const hasTracking = Boolean(order.trackingNumber || order.trackingUrl);
  const items = order.items || [];
  const warningStatuses = ['DELAYED', 'ATTEMPTED_DELIVERY', 'FAILURE'];

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-[#B9C5BE] bg-[#F7F5F0] shadow-[0_8px_20px_rgba(24,48,40,0.07)] [content-visibility:auto] [contain-intrinsic-size:760px]">
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between md:p-7">
        <div className="flex gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DFE8E2] text-[#0F5A46]">
            <PackageCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-[#17251F] sm:text-2xl">
                Order {order.name}
              </h2>
              <StatusPill
                label={shippingStatus}
                type={
                  warningStatuses.includes(
                    order.shipmentStatus?.toUpperCase() || ''
                  )
                    ? 'warning'
                    : fulfilled
                      ? 'success'
                      : 'neutral'
                }
              />
            </div>
            <p className="text-sm font-semibold text-[#68756E]">
              Placed on {formatDate(order.processedAt)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D7DDD8] bg-[#EEF2EF] p-4 text-left md:min-w-[220px] md:text-right">
          <p className="text-2xl font-extrabold text-[#17251F]">
            ${formatMoney(order.totalPrice, order.currencyCode)}
          </p>
          <div className="mt-2 space-y-1 text-sm text-[#68756E]">
            <p>
              Payment:{' '}
              <span className="font-bold text-[#17251F]">
                {normalizeStatus(order.financialStatus)}
              </span>
            </p>
            <p>
              Fulfillment:{' '}
              <span className="font-bold text-[#17251F]">
                {normalizeStatus(order.fulfillmentStatus)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="border-t border-[#D7DDD8] px-6 py-5 md:px-7">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F5A46]">
            Items in this order
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="flex items-center gap-4 rounded-2xl border border-[#D7DDD8] bg-[#EEF2EF] p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                  {item.image ? (
                    <img
                      src={getOptimizedImageUrl(item.image)}
                      alt={item.imageAlt || item.title}
                      loading="lazy"
                      decoding="async"
                      width="160"
                      height="160"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-6 w-6 text-[#0F5A46]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 font-bold text-[#17251F]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#68756E]">
                    Qty: {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-[#D7DDD8] px-6 py-6 md:px-7">
        <OrderProgress step={step} shipmentStatus={order.shipmentStatus} />

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[#D7DDD8] bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-[#0F5A46]">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-xs font-extrabold uppercase tracking-[0.14em]">
                Payment
              </p>
            </div>
            <p className="font-bold text-[#17251F]">
              {paymentPaid ? 'Payment confirmed' : 'Payment pending'}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D7DDD8] bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-[#0F5A46]">
              <Clock className="h-4 w-4" />
              <p className="text-xs font-extrabold uppercase tracking-[0.14em]">
                Status
              </p>
            </div>
            <p className="font-bold text-[#17251F]">{shippingStatus}</p>
          </div>

          <div className="rounded-2xl border border-[#D7DDD8] bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-[#0F5A46]">
              <Truck className="h-4 w-4" />
              <p className="text-xs font-extrabold uppercase tracking-[0.14em]">
                Tracking
              </p>
            </div>
            {hasTracking ? (
              <div className="space-y-1">
                <p className="font-bold text-[#17251F]">
                  {order.carrier || 'Carrier'}: {order.trackingNumber}
                </p>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sm font-bold text-[#0F5A46] hover:text-[#8A6A24]"
                  >
                    Track package
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <p className="font-bold text-[#17251F]">
                {fulfilled ? 'Tracking not available yet' : 'Not shipped yet'}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {order.trackingUrl ? (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center rounded-xl bg-[#0F5A46] px-5 text-sm font-bold text-white transition-colors hover:bg-[#126B54]"
            >
              Track Package
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          ) : (
            <a
              href="/track-order"
              className="inline-flex h-11 items-center rounded-xl bg-[#0F5A46] px-5 text-sm font-bold text-white transition-colors hover:bg-[#126B54]"
            >
              Track Order
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          )}
          <a
            href="/contact"
            className="inline-flex h-11 items-center rounded-xl border border-[#B9C5BE] bg-white px-5 text-sm font-bold text-[#17251F] transition-colors hover:border-[#0F5A46] hover:text-[#0F5A46]"
          >
            Need Help?
          </a>
        </div>
      </div>
    </article>
  );
});

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      try {
        const response = await fetch('/api/customer/orders', {
          signal: controller.signal,
          credentials: 'include',
          headers: {Accept: 'application/json'},
        });

        if (response.status === 401 || response.status === 403) {
          setRequiresLogin(true);
          return;
        }

        const data = await readJsonResponse(response);
        if (!response.ok || !data?.success) {
          throw new Error('Orders request failed');
        }

        if (!controller.signal.aborted) {
          setOrders(Array.isArray(data.orders) ? data.orders : []);
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          console.error('Unable to load customer orders:', requestError);
          setOrders([]);
          setError('Your orders could not be loaded. Please try again later.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadOrders();
    return () => controller.abort();
  }, []);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(a.processedAt || 0).getTime();
      const dateB = new Date(b.processedAt || 0).getTime();
      return dateB - dateA;
    });
  }, [orders]);

  return (
    <main className="min-h-screen bg-[#CDD6CF] px-4 py-8 sm:px-6 md:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="relative mb-6 overflow-hidden rounded-[1.5rem] border border-[#315D50] bg-[#123F34] px-6 py-7 shadow-[0_10px_24px_rgba(24,48,40,0.12)] sm:px-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full border border-white/[0.07]" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-[#E0C575]">
                <PackageCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#D8BE6B]">
                  Purchase History
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] text-white sm:text-4xl">
                  My orders
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#C5D0CB]">
                  Review payment, fulfillment, shipping, and tracking details
                  for your purchases in one place.
                </p>
              </div>
            </div>

            {!loading && !requiresLogin && !error && (
              <p className="w-fit rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-bold text-[#D7E0DB]">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'}
              </p>
            )}
          </div>
        </header>

        <div aria-live="polite">
          {loading ? (
            <div className="rounded-[1.5rem] border border-[#B9C5BE] bg-[#E2E7E3] p-10 text-center text-sm font-semibold text-[#68756E]">
              Loading your orders...
            </div>
          ) : requiresLogin ? (
            <section className="rounded-[1.5rem] border border-[#B9C5BE] bg-[#F7F5F0] px-6 py-14 text-center shadow-[0_8px_20px_rgba(24,48,40,0.07)] sm:py-16">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2E8CA] text-[#8A6A24]">
                <LogIn className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold text-[#17251F]">
                Sign in to view your orders
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#68756E]">
                Your order history is connected securely to your Shopify
                customer account.
              </p>
              <a
                href={shopifyAuthLoginUrl}
                className="mx-auto mt-6 inline-flex h-12 items-center rounded-xl bg-[#0F5A46] px-6 text-sm font-bold text-white transition-colors hover:bg-[#126B54]"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In or Create Account
              </a>
            </section>
          ) : error ? (
            <section className="rounded-[1.5rem] border border-[#D9AAA4] bg-[#FFF8F7] px-6 py-12 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-[#A13D32]" />
              <h2 className="mt-4 text-xl font-extrabold text-[#17251F]">
                Orders unavailable
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#8E342B]">
                {error}
              </p>
            </section>
          ) : sortedOrders.length === 0 ? (
            <section className="rounded-[1.5rem] border border-[#B9C5BE] bg-[#F7F5F0] px-6 py-14 text-center shadow-[0_8px_20px_rgba(24,48,40,0.07)] sm:py-16">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DFE8E2] text-[#0F5A46]">
                <Package className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold text-[#17251F]">
                No orders yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#68756E]">
                Once you complete your first purchase, your orders will appear
                here automatically.
              </p>
              <a
                href="/catalog"
                className="mx-auto mt-6 inline-flex h-12 items-center rounded-xl bg-[#0F5A46] px-6 text-sm font-bold text-white transition-colors hover:bg-[#126B54]"
              >
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </section>
          ) : (
            <section className="space-y-5">
              {sortedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}