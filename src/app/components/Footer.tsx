import {
  Facebook,
  Instagram,
  Youtube,
  Mail,
  ArrowRight,
  ShieldCheck,
  Truck,
  CreditCard,
} from 'lucide-react';

const shopLinks = [
  ['Catalog', '/catalog'],
  ['New Arrivals', '/new-arrivals'],
  ['Collections', '/collections'],
  ['Brands', '/brands'],
];

const serviceLinks = [
  ['Contact', '/contact'],
  ['Track Order', '/track-order'],
  ['Shipping Policy', '/shipping-policy'],
  ['Returns Policy', '/returns-policy'],
];

const legalLinks = [
  ['Privacy Policy', '/privacy-policy'],
  ['Terms of Service', '/terms-of-service'],
];

const socialLinks = [
  {
    href: 'https://facebook.com',
    icon: Facebook,
    label: 'Facebook',
  },
  {
    href: 'https://instagram.com',
    icon: Instagram,
    label: 'Instagram',
  },
  {
    href: 'https://youtube.com',
    icon: Youtube,
    label: 'YouTube',
  },
];

const footerLinkClass =
  'group inline-flex items-center gap-2 text-white/65 transition-all duration-300 hover:translate-x-1 hover:text-white';

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[radial-gradient(circle_at_15%_12%,rgba(15,90,70,0.30),transparent_28%),radial-gradient(circle_at_85%_22%,rgba(200,164,93,0.18),transparent_30%),linear-gradient(135deg,#071611_0%,#111111_52%,#1B1710_100%)] text-white">
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.32)_70%,rgba(0,0,0,0.78)_100%)]" />

      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#0F5A46]/18 blur-3xl" />
      <div className="absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-[#C8A45D]/14 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 py-16 md:px-6 md:py-20">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <a
              href="/"
              className="group mb-6 inline-flex items-center transition-all duration-300 hover:-translate-y-0.5"
            >
              <img
                src="/logo.png"
                alt="IL Distributions LLC"
                className="h-14 w-auto max-w-[240px] object-contain brightness-0 invert transition-all duration-300 group-hover:scale-[1.03] group-hover:drop-shadow-[0_8px_18px_rgba(200,164,93,0.25)]"
              />
            </a>

            <p className="mb-6 max-w-md text-sm leading-relaxed text-white/68">
              Your trusted source for curated products, collectibles, and premium
              finds delivered with reliable service.
            </p>

            <a
              href="mailto:support@ildistributions.com"
              className="group inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/75 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0F5A46]/40 hover:bg-white/[0.09] hover:text-white hover:shadow-[0_12px_30px_rgba(15,90,70,0.18)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F5A46]/20 text-[#C8A45D] transition-all duration-300 group-hover:bg-[#0F5A46] group-hover:text-white">
                <Mail className="h-4 w-4" />
              </span>
              support@ildistributions.com
            </a>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.18em] text-white">
              Shop
            </h3>

            <ul className="space-y-3 text-sm">
              {shopLinks.map(([label, href]) => (
                <li key={href}>
                  <a href={href} className={footerLinkClass}>
                    <ArrowRight className="h-3.5 w-3.5 text-[#C8A45D] opacity-0 transition-all duration-300 group-hover:opacity-100" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.18em] text-white">
              Customer Service
            </h3>

            <ul className="space-y-3 text-sm">
              {serviceLinks.map(([label, href]) => (
                <li key={href}>
                  <a href={href} className={footerLinkClass}>
                    <ArrowRight className="h-3.5 w-3.5 text-[#C8A45D] opacity-0 transition-all duration-300 group-hover:opacity-100" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.18em] text-white">
              Trust & Legal
            </h3>

            <ul className="mb-7 space-y-3 text-sm">
              {legalLinks.map(([label, href]) => (
                <li key={href}>
                  <a href={href} className={footerLinkClass}>
                    <ArrowRight className="h-3.5 w-3.5 text-[#C8A45D] opacity-0 transition-all duration-300 group-hover:opacity-100" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              {[
                [ShieldCheck, 'Secure checkout'],
                [Truck, 'Tracked shipping'],
                [CreditCard, 'Protected payments'],
              ].map(([Icon, label]) => (
                <div
                  key={label as string}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/70"
                >
                  <Icon className="h-4 w-4 text-[#C8A45D]" />
                  <span>{label as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-white/75 transition-all duration-300 hover:-translate-y-1 hover:border-[#0F5A46]/50 hover:bg-[#0F5A46] hover:text-white hover:shadow-[0_12px_30px_rgba(15,90,70,0.25)]"
                  >
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </a>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/55">
              <span>© 2026 IL Distributions LLC. All rights reserved.</span>

              <a
                href="/privacy-policy"
                className="transition-colors duration-300 hover:text-white"
              >
                Privacy Policy
              </a>

              <a
                href="/terms-of-service"
                className="transition-colors duration-300 hover:text-white"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/10 bg-white/[0.04]">
        <div className="container mx-auto px-4 py-6 md:px-6">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/45">
            <span className="mr-1">We accept:</span>

            {['Visa', 'Mastercard', 'American Express', 'PayPal', 'Apple Pay', 'Google Pay'].map(
              (payment) => (
                <span
                  key={payment}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-semibold text-white/55"
                >
                  {payment}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}