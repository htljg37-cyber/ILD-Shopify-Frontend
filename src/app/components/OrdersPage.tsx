import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Package, ExternalLink } from "lucide-react";

interface Order {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: string;
  currencyCode: string;
  statusUrl?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/customer/orders");
        const data = await response.json();

        if (data.success) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    }

    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-24 text-center">
        Loading your orders...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-14">

      <div className="mb-10">
        <span className="rounded-full bg-[#EEF6F3] px-4 py-2 text-sm font-semibold text-[#0F5A46]">
          IL Distributions LLC
        </span>

        <h1 className="mt-5 text-5xl font-bold">
          My Orders
        </h1>

        <p className="mt-4 text-gray-500">
          Review your purchase history and order status.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border p-16 text-center">

          <Package
            className="mx-auto mb-6 text-[#0F5A46]"
            size={55}
          />

          <h2 className="text-2xl font-bold">
            No orders yet
          </h2>

          <p className="mt-3 text-gray-500">
            Once you complete your first purchase,
            your orders will appear here.
          </p>

          <a
            href="/catalog"
            className="mt-8 inline-flex rounded-xl bg-[#0F5A46] px-8 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Continue Shopping
          </a>

        </div>
      ) : (
        <div className="space-y-5">

          {orders.map((order) => (

            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border bg-white p-6 shadow-sm"
            >

              <div className="flex flex-wrap justify-between gap-6">

                <div>

                  <h2 className="text-xl font-bold">
                    {order.name}
                  </h2>

                  <p className="mt-2 text-gray-500">
                    {new Date(order.processedAt).toLocaleDateString()}
                  </p>

                </div>

                <div className="text-right">

                  <p className="font-semibold">
                    {order.totalPrice} {order.currencyCode}
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    Payment: {order.financialStatus}
                  </p>

                  <p className="text-sm text-gray-500">
                    Fulfillment: {order.fulfillmentStatus || "Pending"}
                  </p>

                </div>

              </div>

              {order.statusUrl && (

                <a
                  href={order.statusUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 text-[#0F5A46] font-semibold"
                >
                  View Order
                  <ExternalLink size={16} />
                </a>

              )}

            </motion.div>

          ))}

        </div>
      )}

    </div>
  );
}