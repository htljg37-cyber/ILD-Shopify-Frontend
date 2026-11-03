import {motion} from 'motion/react';
import {ArrowRight, BadgeCheck, Flower2, Mail, Package, ShieldCheck, Users} from 'lucide-react';
import {PageHero} from './PageHero';
import {CustomerReviews} from './CustomerReviews';

const values = [
  {
    icon: ShieldCheck,
    title: 'Brand New and Original',
    text: 'Every item we sell is brand new. Collectibles come sealed in their original factory packaging, sourced from trusted distributors.',
  },
  {
    icon: Package,
    title: 'Packed with Care',
    text: 'Boxes matter to collectors, so orders are packed to protect both the item and its packaging. Every shipment includes tracking.',
  },
  {
    icon: Mail,
    title: 'Real People Behind Every Order',
    text: 'Questions go straight to our family, not a call center. Write to support@ildistributions.com and we reply, usually within a day.',
  },
];

function goTo(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({top: 0, behavior: 'smooth'});
}

export function AboutPage() {
  return (
    <main className="bg-[#F7F5F0]">
      <PageHero
        title="About IL Distributions"
        description="A family-run store in Southern California bringing diecast cars, anime figures and collectibles to collectors across the U.S."
      />

      <section className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:items-center lg:px-10">
        <motion.div
          initial={{opacity: 0, y: 16}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          transition={{duration: 0.45}}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white/85 px-4 py-2 shadow-sm">
            <Users className="h-4 w-4 text-[#C8A45D]" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#0F5A46]">Our Story</span>
          </div>
          <h2 className="mb-5 text-3xl font-extrabold tracking-[-0.03em] text-[#111111] md:text-4xl">
            Started by a family in 2023, still growing every month
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-[#4A4A55]">
            <p>
              IL Distributions began in 2023 as a small family business in Southern California. Our first
              product was preserved roses: real roses from Ecuador, treated to keep their color and shape for
              over a year. We still offer them for gifts and special occasions.
            </p>
            <p>
              Along the way we saw how many collectors were looking for diecast models, anime figures and
              Funko Pops at fair prices, shipped carefully. That became our main focus. Today our catalog
              includes brands like Jada, Maisto, MiJo Exclusives, MINI GT, Bburago, Funko, Banpresto, Bandai and
              more, and it grows as we add new arrivals.
            </p>
            <p>
              We are a family of four who choose the products, photograph our stock and answer every
              message ourselves. Besides this website, you can also find us on TikTok Shop and on eBay,
              where we are a Top Rated Seller.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{opacity: 0, y: 16}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          transition={{duration: 0.45, delay: 0.08}}
          className="grid grid-cols-5 gap-4"
        >
          <img
            src="/images/about/ild-diecast-shelf.jpg"
            alt="Shelf of boxed diecast models at IL Distributions, including Jada, Maisto and MiJo Exclusives trucks and cars"
            width={768}
            height={1024}
            loading="lazy"
            className="col-span-3 h-full w-full rounded-3xl object-cover shadow-[0_18px_44px_rgba(17,17,17,0.12)]"
          />
          <div className="col-span-2 flex flex-col gap-4">
            <img
              src="/images/about/ild-figures-shelf.jpg"
              alt="Anime figures and Funko Pops in stock at IL Distributions, including Gundam Barbatos and Kaiju No. 8"
              width={1024}
              height={768}
              loading="lazy"
              className="w-full flex-1 rounded-3xl object-cover shadow-[0_18px_44px_rgba(17,17,17,0.12)]"
            />
            <div className="rounded-3xl bg-[#0F5A46] p-5 text-white shadow-[0_18px_44px_rgba(15,90,70,0.2)]">
              <Flower2 className="mb-2 h-6 w-6 text-[#E0C575]" />
              <p className="text-sm leading-relaxed text-white/85">
                These photos show our actual stock on the shelf.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-4 pb-14 sm:px-6 md:pb-20 lg:px-10">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {values.map(({icon: Icon, title, text}) => (
            <article
              key={title}
              className="rounded-3xl border border-[#E1DCD2] bg-white/85 p-6 shadow-[0_12px_34px_rgba(17,17,17,0.045)]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F5A46]/11 text-[#0F5A46]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-extrabold text-[#111111]">{title}</h3>
              <p className="text-sm leading-relaxed text-[#717182]">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => goTo('/catalog')}
            className="inline-flex items-center gap-2 rounded-full bg-[#0F5A46] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0B4535]"
          >
            Browse the catalog <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => goTo('/contact')}
            className="inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/25 bg-white px-6 py-3 text-sm font-bold text-[#0F5A46] transition-colors hover:border-[#0F5A46]"
          >
            <BadgeCheck className="h-4 w-4" /> Contact us
          </button>
        </div>
      </section>

      <CustomerReviews />
    </main>
  );
}
