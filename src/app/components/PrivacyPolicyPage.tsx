import { PolicyPage } from './PolicyPage';

export function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      lastUpdated="May 2026"
    >
      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Information We Collect
        </h2>

        <p>
          IL Distributions LLC may collect personal information such as your
          name, email address, shipping address, and payment details when you
          place an order or contact us through our website.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          How We Use Your Information
        </h2>

        <p>
          We use customer information to process orders, provide support,
          improve our services, and communicate updates related to purchases
          or inquiries.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Payment Security
        </h2>

        <p>
          Payments are securely processed through Shopify and trusted payment
          providers. IL Distributions LLC does not store sensitive payment
          information directly on our servers.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Contact
        </h2>

        <p>
          If you have questions regarding this Privacy Policy, please contact us
          at support@ildistributions.com.
        </p>
      </div>
    </PolicyPage>
  );
}