import {
  Headphones,
  PackageCheck,
  ShieldCheck,
  Truck,
} from 'lucide-react';

const trustItems = [
  {
    title: 'Secure Checkout',
    description: 'Protected Shopify payments',
    icon: ShieldCheck,
  },
  {
    title: 'Tracked Shipping',
    description: 'Tracking provided after shipment',
    icon: Truck,
  },
  {
    title: 'Careful Packaging',
    description: 'Prepared with collectors in mind',
    icon: PackageCheck,
  },
  {
    title: 'Email Support',
    description: 'Help before and after your order',
    icon: Headphones,
  },
];

export function TrustBar() {
  return (
    <section className="relative z-20 overflow-hidden border-y border-white/10 bg-[linear-gradient(90deg,#123B32_0%,#17352E_48%,#292219_100%)] shadow-[0_16px_40px_rgba(17,17,17,0.14)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_50%,rgba(15,90,70,0.34),transparent_28%),radial-gradient(circle_at_92%_40%,rgba(200,164,93,0.13),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,rgba(255,255,255,0.20)_1px,transparent_1px)] bg-[size:80px_80px]" />

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className={`group flex min-h-[132px] flex-col items-center justify-center px-3 py-5 text-center sm:px-5 md:flex-row md:justify-start md:gap-4 md:px-6 md:text-left lg:min-h-[112px] lg:py-5 ${
                    index % 2 === 0
                      ? 'border-r border-white/10'
                      : ''
                  } ${
                    index < 2
                      ? 'border-b border-white/10 lg:border-b-0'
                      : ''
                  } ${
                    index > 0
                      ? 'lg:border-l lg:border-white/10'
                      : ''
                  } lg:border-r-0`}
                >
                  <div className="mb-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#F1D58D]/35 bg-[#C8A45D] text-[#07110E] shadow-[0_10px_26px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:-translate-y-0.5 md:mb-0 md:h-12 md:w-12">
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold tracking-tight text-white md:text-[15px]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/55 sm:text-xs">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}