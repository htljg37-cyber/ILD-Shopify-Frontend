import { PolicyPage } from './PolicyPage';

export function ShippingPolicyPage() {
  return (
    <PolicyPage
      title="Shipping Policy"
      lastUpdated="May 2026"
    >
      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Order Processing
        </h2>

        <p>
          Orders are typically processed within 1–3 business days after
          payment confirmation. Processing times may vary during holidays,
          promotions, or high-demand periods.
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
          Delivery estimates may vary depending on the shipping destination,
          carrier delays, weather conditions, or product availability.
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