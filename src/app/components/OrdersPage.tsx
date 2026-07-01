import { useEffect, useState } from 'react';
import { Package, ShoppingBag } from 'lucide-react';

type Order = {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string | null;
  totalPrice: string;
  currencyCode: string;
  statusUrl?: string | null;
};

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

  if (loading) {
    return (
      <section className="bg-[#FAFAFA] py-16">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-[#717182] font-semibold">Loading your orders...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#FAFAFA] py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-10">
          <span className="inline-flex rounded-full bg-[#0F5A46]/10 px-4 py-2 text-sm font-bold text-[#0F5A46]">
            IL Distributions LLC
          </span>

          <h2 className="mt-5 text-3xl md:text-5xl font-extrabold tracking-tight text-[#111111]">
            My Orders
          </h2>

          <p className="mt-3 text-[#717182]">
            Review your purchase history and order status.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl border border-[#EAE7DF] bg-white p-12 md:p-16 text-center shadow-sm">
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
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl border border-[#EAE7DF] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F5A46]/10">
                      <ShoppingBag className="h-6 w-6 text-[#0F5A46]" />
                    </div>

                    <div>
                      <h3 className="text-xl font-extrabold text-[#111111]">
                        {order.name}
                      </h3>

                      <p className="mt-1 text-sm text-[#717182]">
                        Placed on{' '}
                        {order.processedAt
                          ? new Date(order.processedAt).toLocaleDateString()
                          : 'Date unavailable'}
                      </p>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-xl font-extrabold text-[#111111]">
                      ${Number(order.totalPrice || 0).toFixed(2)}{' '}
                      {order.currencyCode}
                    </p>

                    <p className="mt-2 text-sm text-[#717182]">
                      Payment: {order.financialStatus || 'Unavailable'}
                    </p>

                    <p className="text-sm text-[#717182]">
                      Fulfillment: {order.fulfillmentStatus || 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 border-t border-[#EAE7DF] pt-5">
                  <a
                    href="https://account.ildistributions.com/orders"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-[#0F5A46] px-5 py-2 text-sm font-bold text-[#0F5A46] transition hover:bg-[#0F5A46] hover:text-white"
                  >
                    View in Shopify Account
                  </a>

                  <a
                    href="/track-order"
                    className="rounded-xl border border-[#EAE7DF] px-5 py-2 text-sm font-bold text-[#111111] transition hover:bg-[#F5F5F5] hover:text-[#0F5A46]"
                  >
                    Track Order
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}