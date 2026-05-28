import { motion } from 'motion/react';
import { ArrowRight, Car, Package, Sparkles, Star } from 'lucide-react';

const categories = [
  {
    title: 'Diecast Models',
    description: 'Scale cars, trucks, and collectible vehicles.',
    href: '/collections/diecast-model-cars',
    icon: Car,
    label: 'Vehicles',
  },
  {
    title: 'Collectibles',
    description: 'Figures, limited pieces, and display collectibles.',
    href: '/collections/collectible-figures',
    icon: Package,
    label: 'Figures',
  },
  {
    title: 'New Arrivals',
    description: 'Recently added products from our catalog.',
    href: '/new-arrivals',
    icon: Sparkles,
    label: 'Latest',
  },
  {
    title: 'Featured Products',
    description: 'Highlighted items selected for shoppers.',
    href: '/catalog',
    icon: Star,
    label: 'Premium',
  },
];

export function CategoryCards() {
  return (
    <section className="relative overflow-hidden py-16 md:py-20 bg-[radial-gradient(circle_at_10%_10%,rgba(15,90,70,0.07),transparent_28%),radial-gradient(circle_at_90%_30%,rgba(200,164,93,0.10),transparent_28%),linear-gradient(180deg,#FFFFFF_0%,#F8F7F3_100%)]">
      <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white/70 px-4 py-2 shadow-sm mb-4"
            >
              <Sparkles className="h-4 w-4 text-[#C8A45D]" />
              <span className="text-sm font-semibold text-[#0F5A46]">
                Curated Shopping Paths
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold tracking-tight text-[#111111] mb-3"
            >
              Shop by Category
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#717182] max-w-xl"
            >
              Find the right collection faster with premium product categories
              curated for collectors and everyday shoppers.
            </motion.p>
          </div>

          <a
            href="/collections"
            className="group inline-flex items-center gap-2 text-sm font-bold text-[#0F5A46] transition-all duration-300 hover:-translate-y-0.5"
          >
            View all collections
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;

            return (
              <motion.a
                key={category.title}
                href={category.href}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="group relative overflow-hidden rounded-3xl border border-[#EAE7DF] bg-white/85 p-6 shadow-[0_10px_30px_rgba(17,17,17,0.04)] backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#0F5A46]/25 hover:shadow-[0_22px_55px_rgba(15,90,70,0.13)] active:translate-y-0"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_25%_0%,rgba(15,90,70,0.10),transparent_38%),radial-gradient(circle_at_80%_10%,rgba(200,164,93,0.16),transparent_38%)]" />

                <div className="relative z-10 flex items-start justify-between mb-7">
                  <div className="relative h-13 w-13 rounded-2xl bg-[#0F5A46] flex items-center justify-center shadow-[0_12px_26px_rgba(15,90,70,0.22)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:shadow-[0_16px_34px_rgba(15,90,70,0.30)]">
                    <Icon className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
                  </div>

                  <span className="rounded-full border border-[#C8A45D]/25 bg-[#C8A45D]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A6A24]">
                    {category.label}
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#111111] mb-3 transition-colors duration-300 group-hover:text-[#0F5A46]">
                    {category.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-[#717182] min-h-[48px] mb-7">
                    {category.description}
                  </p>

                  <div className="inline-flex items-center gap-2 text-sm font-bold text-[#0F5A46] transition-all duration-300 group-hover:gap-3">
                    Explore
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0F5A46]/10 transition-all duration-300 group-hover:bg-[#0F5A46]">
                      <ArrowRight className="h-4 w-4 transition-all duration-300 group-hover:text-white group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>

                <div className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-[#C8A45D]/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}