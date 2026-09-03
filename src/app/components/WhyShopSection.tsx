import {motion} from 'motion/react';
import {
  ArrowRight,
  Headphones,
  Package,
  RefreshCw,
  Ruler,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    icon: Package,
    title: 'Collector-Focused Catalog',
    description:
      'Browse diecast models, figures, display pieces, and other finds selected with collectors in mind.',
    accent: 'green',
  },
  {
    icon: Ruler,
    title: 'Clear Size Information',
    description:
      'Scale guides and detailed product information make it easier to choose the right piece for your display.',
    accent: 'gold',
  },
  {
    icon: RefreshCw,
    title: 'A Growing Selection',
    description:
      'Discover an expanding catalog as new products, collectible brands, and categories are added to the store.',
    accent: 'green',
  },
  {
    icon: Headphones,
    title: 'Direct Customer Support',
    description:
      'Need help with a product or order? Contact ILD directly and receive a clear, helpful response.',
    accent: 'gold',
  },
];

export function WhyShopSection() {
  function goToCatalog() {
    window.history.pushState({}, '', '/catalog');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  return (
    <section className="performance-section relative overflow-hidden bg-[#F7F5F0] pt-8 pb-6 md:pt-10 md:pb-8">
      <div className="relative z-10 mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-10">
        <div className="mb-8 max-w-3xl md:mb-10">
          <motion.div
            initial={{opacity: 0, y: 12}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white/85 px-4 py-2 shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-[#C8A45D]" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#0F5A46]">
              The ILD Difference
            </span>
          </motion.div>

          <motion.h2
            initial={{opacity: 0, y: 14}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            className="mb-3 text-4xl font-extrabold tracking-[-0.045em] text-[#111111] md:text-5xl"
          >
            Built for Collectors
          </motion.h2>

          <motion.p
            initial={{opacity: 0, y: 14}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{delay: 0.08}}
            className="max-w-2xl text-base leading-relaxed text-[#717182]"
          >
            A more helpful way to explore collectibles, understand their size,
            and find the right addition for your collection.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isGold = feature.accent === 'gold';

            return (
              <motion.article
                key={feature.title}
                initial={{opacity: 0, y: 18}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true, margin: '-70px'}}
                transition={{delay: index * 0.07, duration: 0.42}}
                className="group relative h-full overflow-hidden rounded-3xl border border-[#E1DCD2] bg-white/80 p-6 shadow-[0_12px_34px_rgba(17,17,17,0.045)] transition-all duration-300 hover:-translate-y-1 hover:border-[#0F5A46]/25 hover:shadow-[0_22px_55px_rgba(15,90,70,0.11)]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0F5A46]/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 ${
                    isGold
                      ? 'bg-[#C8A45D]/14 text-[#8A6A24] shadow-[0_12px_26px_rgba(200,164,93,0.16)]'
                      : 'bg-[#0F5A46]/11 text-[#0F5A46] shadow-[0_12px_26px_rgba(15,90,70,0.14)]'
                  }`}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <h3 className="mb-3 text-xl font-extrabold tracking-tight text-[#111111] transition-colors duration-300 group-hover:text-[#0F5A46]">
                  {feature.title}
                </h3>

                <p className="text-sm leading-relaxed text-[#717182]">
                  {feature.description}
                </p>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{opacity: 0, y: 18}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, margin: '-70px'}}
          transition={{delay: 0.12}}
          className="relative mt-8 overflow-hidden rounded-3xl bg-[#0F5A46] px-6 py-7 shadow-[0_22px_55px_rgba(15,90,70,0.18)] sm:px-8 md:flex md:items-center md:justify-between md:gap-8"
        >
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#C8A45D]/18 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.045] bg-[linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[size:38px_38px]" />

          <div className="relative z-10 mb-5 md:mb-0">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#D9BE82]">
              Find your next collectible
            </p>
            <h3 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              Ready to explore the full catalog?
            </h3>
          </div>

          <button
            type="button"
            onClick={goToCatalog}
            className="relative z-10 inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-[#0F5A46] shadow-[0_10px_28px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#FFF9EB] hover:shadow-[0_14px_32px_rgba(0,0,0,0.20)]"
          >
            Explore the Catalog
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}