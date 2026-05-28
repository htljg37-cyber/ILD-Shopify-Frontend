import { PolicyPage } from './PolicyPage';

export function ReturnsPolicyPage() {
  return (
    <PolicyPage
      title="Returns Policy"
      lastUpdated="May 2026"
    >
      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Return Eligibility
        </h2>

        <p>
          Customers may request a return within 30 days of delivery for
          eligible items in their original condition and packaging.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Non-Returnable Items
        </h2>

        <p>
          Certain products such as opened collectibles, customized items,
          clearance products, or used items may not qualify for returns.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Refund Process
        </h2>

        <p>
          Approved refunds will be processed back to the original payment
          method after the returned item has been received and inspected.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Return Shipping
        </h2>

        <p>
          Customers may be responsible for return shipping costs unless the
          return is due to a damaged, defective, or incorrect item.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Contact
        </h2>

        <p>
          For return requests or questions, please contact
          support@ildistributions.com.
        </p>
      </div>
    </PolicyPage>
  );
}