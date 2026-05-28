import { motion } from 'motion/react';
import { Mail, ArrowRight, Sparkles, Bell, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function NewsletterSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 bg-[radial-gradient(circle_at_15%_15%,rgba(15,90,70,0.35),transparent_28%),radial-gradient(circle_at_85%_25%,rgba(200,164,93,0.22),transparent_30%),linear-gradient(135deg,#071611_0%,#111111_50%,#1B1710_100%)]">
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.35)_70%,rgba(0,0,0,0.78)_100%)]" />

      <motion.div
        animate={{ y: [0, 18, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-[#0F5A46]/18 blur-3xl"
      />

      <motion.div
        animate={{ y: [0, -18, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-[#C8A45D]/16 blur-3xl"
      />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/35 bg-[#0F5A46]/18 px-4 py-2 shadow-[0_10px_30px_rgba(15,90,70,0.12)] backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-[#C8A45D]" />
              <span className="text-sm font-semibold text-white/90">
                Product Updates
              </span>
            </div>

            <h2 className="mb-5 text-4xl font-bold tracking-tight text-white md:text-6xl">
              Stay Updated With ILD
            </h2>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
              Get notified about new arrivals, curated releases, and featured
              products from IL Distributions LLC.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.07] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl md:p-10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-[#C8A45D]/10" />
            <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#0F5A46]/18 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-7 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <Bell className="mb-3 h-5 w-5 text-[#C8A45D]" />
                  <p className="text-sm font-semibold text-white">
                    New arrival updates
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <Sparkles className="mb-3 h-5 w-5 text-[#C8A45D]" />
                  <p className="text-sm font-semibold text-white">
                    Curated product releases
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <ShieldCheck className="mb-3 h-5 w-5 text-[#C8A45D]" />
                  <p className="text-sm font-semibold text-white">
                    No spam, unsubscribe anytime
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 md:flex-row">
                <div className="group relative flex-1">
                  <Mail className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-white/50 transition-all duration-300 group-hover:text-[#C8A45D] group-focus-within:text-[#C8A45D]" />

                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    className="h-14 rounded-2xl border-white/15 bg-white/10 pl-12 text-white placeholder:text-white/45 transition-all duration-300 hover:bg-white/[0.13] hover:shadow-[0_12px_30px_rgba(15,90,70,0.16)] focus-visible:border-[#C8A45D]/60 focus-visible:ring-[#C8A45D]/30"
                  />
                </div>

                <Button
                  size="lg"
                  className="group h-14 whitespace-nowrap rounded-2xl bg-[#0F5A46] px-8 text-white shadow-[0_12px_30px_rgba(15,90,70,0.28)] transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-[#126B54] hover:shadow-[0_18px_42px_rgba(15,90,70,0.38)] active:translate-y-0 active:scale-[0.98]"
                >
                  Subscribe Now
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </div>

              <p className="mt-6 text-center text-sm text-white/50">
                Stay updated with premium picks, new arrivals, and curated releases.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}