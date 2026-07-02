import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Sparkles, Zap, TrendingUp, ArrowRight } from 'lucide-react';

const heroSlides = [
  {
    image: '/hero-cars.png',
    label: 'FEATURED',
    title: 'Explore Model Cars',
    description: 'Discover selected diecast and collectible vehicles',
  },
  {
    image: '/hero-figures.png',
    label: 'COLLECTIBLES',
    title: 'Action Figures & Collectibles',
    description: 'Premium figures and collectibles in one place',
  },
  {
    image: '/hero-premium.png',
    label: 'PREMIUM',
    title: 'Preserved Flowers',
    description: 'Discover elegant preserved roses crafted to last for years.',
  },
];

const premiumButtonAnimation =
  'transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98]';

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const slide = heroSlides[currentSlide];

  return (
    <section className="relative min-h-[600px] overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(15,90,70,0.35),transparent_28%),radial-gradient(circle_at_80%_35%,rgba(200,164,93,0.14),transparent_30%),linear-gradient(135deg,#071611_0%,#111111_48%,#1B1710_100%)]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F5A46]/20 via-transparent to-[#C8A45D]/10" />
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.35)_72%,rgba(0,0,0,0.75)_100%)]" />

      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#0F5A46] to-transparent" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#C8A45D] to-transparent" />
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#0F5A46] to-transparent" />
      </div>

      <div className="container mx-auto px-4 md:px-6 py-20 md:py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-[#0F5A46]/20 border border-[#0F5A46]/30 rounded-full px-4 py-2">
              <Sparkles className="h-4 w-4 text-[#C8A45D]" />
              <span className="text-sm text-white/90">
                Premium Curated Selection
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Curated Products.
              <br />
              <span className="text-[#0F5A46]">Reliable Distribution.</span>
            </h1>

            <p className="text-base md:text-lg text-white/70 max-w-xl">
              Shop carefully selected products from trusted categories including
              diecast models, collectibles, and premium finds from IL
              Distributions LLC.
            </p>

            <div className="flex flex-wrap gap-4">
              <a href="/catalog">
                <Button
                  size="lg"
                  className={`${premiumButtonAnimation} bg-[#0F5A46] hover:bg-[#126B54] text-white px-8 shadow-md hover:shadow-[0_12px_30px_rgba(15,90,70,0.35)]`}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Shop Now
                </Button>
              </a>

              <a href="/collections">
                <Button
                  size="lg"
                  variant="outline"
                  className={`${premiumButtonAnimation} border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white hover:border-[#C8A45D]/60 px-8 shadow-md hover:shadow-[0_12px_30px_rgba(200,164,93,0.18)]`}
                >
                  Explore Collections
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>

              <a href="/new-arrivals">
                <Button
                  size="lg"
                  className={`${premiumButtonAnimation} bg-[#C8A45D] hover:bg-[#D9B96E] text-[#111111] border border-[#C8A45D] px-8 shadow-md hover:shadow-[0_12px_30px_rgba(200,164,93,0.32)]`}
                >
                  <TrendingUp className="mr-2 h-5 w-5" />
                  New Arrivals
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-3 gap-5 pt-8 border-t border-white/10 max-w-xl">
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">
                  Curated
                </div>
                <div className="text-xs md:text-sm text-white/60">
                  Product Selection
                </div>
              </div>

              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">
                  Secure
                </div>
                <div className="text-xs md:text-sm text-white/60">
                  Checkout
                </div>
              </div>

              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">
                  Support
                </div>
                <div className="text-xs md:text-sm text-white/60">
                  Customer Service
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              <a
                href="/catalog"
                className="block relative z-10 rounded-2xl overflow-hidden shadow-2xl group transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_18px_45px_rgba(200,164,93,0.22)] active:translate-y-0 active:scale-[0.98]"
              >
                <div className="relative w-full h-[320px] md:h-[400px] overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={slide.image}
                      src={slide.image}
                      alt={slide.title}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.8, ease: 'easeInOut' }}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </AnimatePresence>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="inline-block bg-[#C8A45D] text-[#111111] text-xs font-semibold px-3 py-1 rounded-full mb-2">
                      {slide.label}
                    </span>

                    <h3 className="text-xl font-bold text-white">
                      {slide.title}
                    </h3>

                    <p className="text-white/80 text-sm">
                      {slide.description}
                    </p>
                  </div>

                  <div className="absolute bottom-5 right-5 flex gap-2">
                    {heroSlides.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentSlide(index);
                        }}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          currentSlide === index
                            ? 'w-8 bg-[#C8A45D]'
                            : 'w-2.5 bg-white/50'
                        }`}
                        aria-label={`Show slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </a>

              <motion.div
                animate={{ y: [0, 15, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-6 -right-6 w-32 h-32 bg-[#0F5A46]/20 rounded-full blur-3xl"
              />

              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-6 -left-6 w-40 h-40 bg-[#C8A45D]/20 rounded-full blur-3xl"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}