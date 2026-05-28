import { PolicyPage } from './PolicyPage';

export function TermsOfServicePage() {
  return (
    <PolicyPage
      title="Terms of Service"
      lastUpdated="May 2026"
    >
      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          General Terms
        </h2>

        <p>
          By accessing and using the IL Distributions LLC website, you agree
          to comply with these Terms of Service and all applicable laws
          and regulations.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Product Information
        </h2>

        <p>
          We strive to provide accurate product descriptions, pricing,
          and availability. However, errors may occasionally occur and
          we reserve the right to correct them without prior notice.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Orders and Payments
        </h2>

        <p>
          All orders are subject to availability and confirmation.
          Payments are processed securely through Shopify and approved
          payment providers.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Limitation of Liability
        </h2>

        <p>
          IL Distributions LLC shall not be held responsible for indirect,
          incidental, or consequential damages resulting from the use of
          our products or website.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#111111] mb-3">
          Contact
        </h2>

        <p>
          For questions regarding these Terms of Service, please contact
          support@ildistributions.com.
        </p>
      </div>
    </PolicyPage>
  );
}