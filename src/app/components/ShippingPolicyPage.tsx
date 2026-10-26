import { PolicyPage } from './PolicyPage';

export function ShippingPolicyPage() {
  return (
    <PolicyPage
      title="Shipping Policy"
      lastUpdated="October 2026"
    >
      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Order Processing
        </h2>

        <p>
          Processing times vary by product. Most in-stock items ship within
          1 business day after payment confirmation, while made-to-order and
          partner-fulfilled items (such as custom apparel) may take longer to
          prepare. Please check the estimated delivery time shown on each
          product page before placing your order.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Shipping Carriers
        </h2>

        <p>
          IL Distributions LLC ships orders using trusted carriers such as
          USPS, UPS, and FedEx depending on the product, destination,
          and shipping method selected.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Tracking Information
        </h2>

        <p>
          Tracking information will be provided once the order has shipped.
          Customers can also use the Track Order page for updates when available.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Delivery Times
        </h2>

        <p>
          Each product page shows an estimated delivery window that includes
          both processing and shipping time. This estimate is approximate and
          may vary depending on the shipping destination, carrier delays,
          weather conditions, holidays, or product availability. If your order
          includes items with different delivery estimates, they may arrive
          separately.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Contact
        </h2>

        <p>
          For shipping-related questions, please contact
          support@ildistributions.com.
        </p>
      </div>
    </PolicyPage>
  );
}