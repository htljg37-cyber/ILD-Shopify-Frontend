import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

type PageHeroProps = {
  title: string;
  description: string;
};

export function PageHero({ title, description }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden py-24 md:py-28 bg-[radial-gradient(circle_at_15%_15%,rgba(15,90,70,0.36),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(200,164,93,0.18),transparent_30%),linear-gradient(135deg,#071611_0%,#111111_50%,#1B1710_100%)]">
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.28)_68%,rgba(0,0,0,0.76)_100%)]" />

      <motion.div
        animate={{ y: [0, 18, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-[#0F5A46]/18 blur-3xl"
      />

      <motion.div
        animate={{ y: [0, -18, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#C8A45D]/14 blur-3xl"
      />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/35 bg-[#0F5A46]/18 px-4 py-2 shadow-[0_10px_30px_rgba(15,90,70,0.12)] backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-[#C8A45D]" />
            <span className="text-sm font-semibold text-white/90">
              IL Distributions LLC
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-7xl"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="max-w-2xl text-base leading-relaxed text-white/70 md:text-lg"
          >
            {description}
          </motion.p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C8A45D]/50 to-transparent" />
    </section>
  );
}