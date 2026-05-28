import { useState } from 'react';
import {
  PackageSearch,
  Mail,
  Truck,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Button } from './ui/button';

export function TrackOrderPage() {
  const [carrier, setCarrier] = useState('usps');
  const [trackingNumber, setTrackingNumber] = useState('');

  function handleTrackPackage() {
    if (!trackingNumber.trim()) {
      alert('Please enter your tracking number.');
      return;
    }

    const tracking = encodeURIComponent(trackingNumber.trim());

    const carrierUrls: Record<string, string> = {
      usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`,
      ups: `https://www.ups.com/track?tracknum=${tracking}`,
      fedex: `https://www.fedex.com/fedextrack/?trknbr=${tracking}`,
      dhl: `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${tracking}`,
    };

    window.open(carrierUrls[carrier], '_blank');
  }

  const inputClass =
    'w-full rounded-2xl border border-[#EAE7DF] bg-[#F8F7F3] px-4 py-3 text-sm outline-none transition-all duration-300 hover:bg-white focus:border-[#0F5A46]/40 focus:bg-white focus:shadow-[0_12px_30px_rgba(15,90,70,0.10)]';

  return (
    <section className="relative overflow-hidden py-12 md:py-20 bg-[radial-gradient(circle_at_10%_10%,rgba(15,90,70,0.07),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(200,164,93,0.10),transparent_28%),linear-gradient(180deg,#FAFAFA_0%,#F6F4EF_100%)]">
      <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[2rem] border border-[#EAE7DF] bg-white/88 p-6 shadow-[0_18px_55px_rgba(17,17,17,0.06)] backdrop-blur-sm md:p-10">
            <div className="mb-8 text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-[#0F5A46]/8 px-4 py-2">
                <Sparkles className="h-4 w-4 text-[#C8A45D]" />
                <span className="text-sm font-bold text-[#0F5A46]">
                  Order Tracking
                </span>
              </div>

              <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-[#111111] md:text-5xl">
                Track Your Order
              </h2>

              <p className="mx-auto max-w-2xl text-[#717182]">
                Enter your tracking number and select the shipping carrier to
                view your package status directly with the carrier.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-[#EAE7DF] bg-[#F8F7F3] p-5 md:p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-[#111111]">
                    Tracking Number
                  </label>

                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#111111]">
                    Shipping Carrier
                  </label>

                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className={inputClass}
                  >
                    <option value="usps">USPS</option>
                    <option value="ups">UPS</option>
                    <option value="fedex">FedEx</option>
                    <option value="dhl">DHL</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleTrackPackage}
                className="mt-5 h-14 w-full rounded-2xl bg-[#0F5A46] text-base text-white shadow-[0_12px_30px_rgba(15,90,70,0.28)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#126B54] hover:shadow-[0_18px_42px_rgba(15,90,70,0.38)] active:translate-y-0 active:scale-[0.98]"
              >
                <Truck className="mr-2 h-5 w-5" />
                Track Package
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                [
                  Mail,
                  'Check Email',
                  'Your tracking number is sent after your order ships.',
                ],
                [
                  Truck,
                  'Select Carrier',
                  'Choose USPS, UPS, FedEx, or DHL before tracking.',
                ],
                [
                  PackageSearch,
                  'Need Help?',
                  'Contact us if you need help locating your order.',
                ],
              ].map(([Icon, title, text]) => (
                <div
                  key={title as string}
                  className="group rounded-3xl border border-[#EAE7DF] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(15,90,70,0.12)]"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F5A46]/10 text-[#0F5A46] transition-all duration-300 group-hover:bg-[#0F5A46] group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mb-2 font-extrabold text-[#111111]">
                    {title as string}
                  </h3>

                  <p className="text-sm leading-relaxed text-[#717182]">
                    {text as string}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 rounded-3xl border border-[#0F5A46]/10 bg-[#0F5A46]/5 p-5 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-[#0F5A46]" />
                <p className="text-sm text-[#717182]">
                  Use the same email used at checkout for support.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-[#0F5A46]" />
                <p className="text-sm text-[#717182]">
                  Tracking may take time to update after shipment.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <PackageSearch className="mt-0.5 h-5 w-5 text-[#0F5A46]" />
                <p className="text-sm text-[#717182]">
                  Include order number and tracking number if contacting us.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}