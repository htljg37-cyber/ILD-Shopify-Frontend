import {memo, useState} from 'react';
import type {FormEvent} from 'react';
import {
  ArrowRight,
  Clock,
  Mail,
  PackageSearch,
  ShieldCheck,
  Truck,
} from 'lucide-react';

const carrierUrls: Record<string, (tracking: string) => string> = {
  usps: (tracking) =>
    `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`,
  ups: (tracking) => `https://www.ups.com/track?tracknum=${tracking}`,
  fedex: (tracking) =>
    `https://www.fedex.com/fedextrack/?trknbr=${tracking}`,
  dhl: (tracking) =>
    `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${tracking}`,
};

const trackingSteps = [
  {
    icon: Mail,
    title: 'Check your email',
    text: 'Your tracking number is sent when the order ships.',
  },
  {
    icon: Truck,
    title: 'Select the carrier',
    text: 'Choose the carrier shown in your shipping confirmation.',
  },
  {
    icon: PackageSearch,
    title: 'View the latest status',
    text: 'We will open the official carrier tracking page.',
  },
];

const TrackingStep = memo(function TrackingStep({
  icon: Icon,
  number,
  title,
  text,
}: {
  icon: typeof Mail;
  number: number;
  title: string;
  text: string;
}) {
  return (
    <li className="flex gap-4 border-b border-white/10 py-5 first:pt-0 last:border-0 last:pb-0">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#E0C575]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D2B963]">
          Step {number}
        </p>
        <h3 className="mt-1 font-extrabold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[#BDCBC5]">{text}</p>
      </div>
    </li>
  );
});

export function TrackOrderPage() {
  const [carrier, setCarrier] = useState('usps');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState('');

  function handleTrackPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTrackingNumber = trackingNumber.trim();

    if (!cleanedTrackingNumber) {
      setError('Enter your tracking number to continue.');
      return;
    }

    setError('');
    const tracking = encodeURIComponent(cleanedTrackingNumber);
    const destination = carrierUrls[carrier]?.(tracking);

    if (destination) {
      window.open(destination, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <main className="min-h-screen bg-[#CDD6CF] px-4 py-8 sm:px-6 md:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <section className="overflow-hidden rounded-[1.75rem] border border-[#AEBBB4] bg-[#F7F5F0] shadow-[0_12px_28px_rgba(24,48,40,0.1)]">
          <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
            <div className="relative bg-[#123F34] px-6 py-8 sm:px-8 md:p-10 lg:p-12">
              <div className="absolute inset-y-0 right-0 hidden w-px bg-white/10 lg:block" />
              <div className="mb-7 max-w-md">
                <div className="mb-4 flex items-center gap-2 text-[#D8BE6B]">
                  <PackageSearch className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-[0.14em]">
                    Order Tracking
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-white sm:text-4xl">
                  Where is my order?
                </h1>

                <p className="mt-3 text-sm leading-relaxed text-[#C5D0CB] sm:text-base">
                  Use the tracking number from your shipping email to check the
                  latest update directly with the carrier.
                </p>
              </div>

              <ol>
                {trackingSteps.map((step, index) => (
                  <TrackingStep
                    key={step.title}
                    {...step}
                    number={index + 1}
                  />
                ))}
              </ol>
            </div>

            <div className="flex flex-col justify-center px-6 py-8 sm:px-8 md:p-10 lg:p-12">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#0F5A46]">
                  Track a shipment
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.025em] text-[#17251F] sm:text-3xl">
                  Enter your shipping details
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#68756E]">
                  Select the correct carrier before opening your tracking
                  result.
                </p>

                <form onSubmit={handleTrackPackage} className="mt-7" noValidate>
                  <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
                    <div>
                      <label
                        htmlFor="tracking-number"
                        className="mb-2 block text-sm font-bold text-[#17251F]"
                      >
                        Tracking Number
                      </label>
                      <input
                        id="tracking-number"
                        name="tracking-number"
                        type="text"
                        value={trackingNumber}
                        onChange={(event) => {
                          setTrackingNumber(event.target.value);
                          if (error) setError('');
                        }}
                        placeholder="Enter tracking number"
                        autoComplete="off"
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? 'tracking-error' : undefined}
                        className="h-12 w-full rounded-xl border border-[#C6CEC8] bg-white px-4 text-sm text-[#17251F] outline-none transition-colors placeholder:text-[#8B9690] hover:border-[#97AAA0] focus:border-[#0F5A46] focus:ring-2 focus:ring-[#0F5A46]/15"
                      />
                      {error && (
                        <p
                          id="tracking-error"
                          role="alert"
                          className="mt-2 text-sm font-semibold text-[#A13D32]"
                        >
                          {error}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="shipping-carrier"
                        className="mb-2 block text-sm font-bold text-[#17251F]"
                      >
                        Shipping Carrier
                      </label>
                      <select
                        id="shipping-carrier"
                        name="shipping-carrier"
                        value={carrier}
                        onChange={(event) => setCarrier(event.target.value)}
                        className="h-12 w-full rounded-xl border border-[#C6CEC8] bg-white px-4 text-sm font-semibold text-[#17251F] outline-none transition-colors hover:border-[#97AAA0] focus:border-[#0F5A46] focus:ring-2 focus:ring-[#0F5A46]/15"
                      >
                        <option value="usps">USPS</option>
                        <option value="ups">UPS</option>
                        <option value="fedex">FedEx</option>
                        <option value="dhl">DHL</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#0F5A46] px-5 text-sm font-bold text-white transition-colors hover:bg-[#126B54] focus:outline-none focus:ring-2 focus:ring-[#0F5A46]/30 focus:ring-offset-2 active:bg-[#0C4C3B]"
                  >
                    <Truck className="mr-2 h-5 w-5" />
                    Track Package
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </form>

                <div className="mt-7 grid gap-3 border-t border-[#D4D9D4] pt-6 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#0F5A46]" />
                    <p className="text-sm leading-relaxed text-[#68756E]">
                      Tracking can take up to 24 hours to update after shipment.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0F5A46]" />
                    <p className="text-sm leading-relaxed text-[#68756E]">
                      Need help? Include your order and tracking numbers when
                      contacting us.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}