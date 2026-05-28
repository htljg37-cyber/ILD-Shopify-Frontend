import { motion } from 'motion/react';
import {
  Truck,
  ShieldCheck,
  Package,
  Headphones,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Reliable Shipping',
    description:
      'Orders are prepared with care and shipped through trusted carriers once fulfilled.',
    accent: 'green',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Checkout',
    description:
      'Checkout is processed securely through Shopify with protected payment options.',
    accent: 'gold',
  },
  {
    icon: Package,
    title: 'Curated Products',
    description:
      'We focus on selected products, collectibles, and premium finds for online shoppers.',
    accent: 'green',
  },
  {
    icon: Headphones,
    title: 'Customer Support',
    description:
      'Questions about an order or product? Contact us and we will respond as soon as possible.',
    accent: 'gold',
  },
];

const trustBadges = [
  {
    icon: ShieldCheck,
    label: 'Secure Checkout',
  },
  {
    icon: Truck,
    label: 'Tracked Shipping',
  },
  {
    icon: Package,
    label: 'Careful Packaging',
  },
  {
    icon: Headphones,
    label: 'Email Support',
  },
];

export function WhyShopSection() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 bg-[radial-gradient(circle_at_10%_20%,rgba(15,90,70,0.08),transparent_28%),radial-gradient(circle_at_90%_18%,rgba(200,164,93,0.11),transparent_30%),linear-gradient(180deg,#FFFFFF_0%,#F8F7F3_100%)]">
      <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,rgba(17,17,17,0.16)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.16)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#0F5A46]/10 blur-3xl" />
      <div className="absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-[#C8A45D]/12 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white/75 px-4 py-2 shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-[#C8A45D]" />
            <span className="text-sm font-semibold text-[#0F5A46]">
              Built for a better shopping experience
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 text-3xl font-bold tracking-tight text-[#111111] md:text-5xl"
          >
            Why Shop With ILD
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-2xl text-[#717182]"
          >
            A simple, secure, and carefully curated shopping experience designed
            to help customers buy with confidence.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isGold = feature.accent === 'gold';

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="group relative h-full overflow-hidden rounded-3xl border border-[#EAE7DF] bg-white/85 p-6 shadow-[0_10px_30px_rgba(17,17,17,0.04)] backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#0F5A46]/25 hover:shadow-[0_22px_55px_rgba(15,90,70,0.13)]"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_30%_0%,rgba(15,90,70,0.10),transparent_38%),radial-gradient(circle_at_88%_10%,rgba(200,164,93,0.16),transparent_38%)]" />

                <div
                  className={`relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_12px_26px_rgba(17,17,17,0.10)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 ${
                    isGold
                      ? 'bg-[#C8A45D]/14 text-[#8A6A24] group-hover:shadow-[0_16px_34px_rgba(200,164,93,0.26)]'
                      : 'bg-[#0F5A46]/12 text-[#0F5A46] group-hover:shadow-[0_16px_34px_rgba(15,90,70,0.22)]'
                  }`}
                >
                  <Icon className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-white/50" />
                </div>

                <div className="relative">
                  <h3 className="mb-3 text-xl font-bold tracking-tight text-[#111111] transition-colors duration-300 group-hover:text-[#0F5A46]">
                    {feature.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-[#717182]">
                    {feature.description}
                  </p>
                </div>

                <div className="absolute bottom-0 left-6 right-6 h-[3px] origin-left scale-x-0 rounded-full bg-gradient-to-r from-[#0F5A46] to-[#C8A45D] transition-transform duration-300 group-hover:scale-x-100" />
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ delay: 0.15 }}
          className="mt-12 rounded-3xl border border-[#EAE7DF] bg-white/75 p-5 shadow-[0_12px_35px_rgba(17,17,17,0.04)] backdrop-blur-sm md:p-6"
        >
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {trustBadges.map((badge, index) => {
              const Icon = badge.icon;

              return (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.06 }}
                  className="group flex items-center gap-2 rounded-full border border-[#0F5A46]/10 bg-[#F8F7F3] px-4 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0F5A46]/25 hover:bg-white hover:shadow-[0_10px_24px_rgba(15,90,70,0.10)]"
                >
                  <Icon className="h-4 w-4 text-[#0F5A46] transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-sm font-semibold text-[#111111]">
                    {badge.label}
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-[#C8A45D]" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}