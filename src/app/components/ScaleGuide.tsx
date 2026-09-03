import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Car, Info, Package, Ruler, Sparkles} from 'lucide-react';

type GuideMode = 'diecast' | 'funko';

type SizeOption = {
  id: string;
  label: string;
  title: string;
  inches: number;
  centimeters: number;
  visualPercent: number;
  description: string;
};

const DIECAST_SCALES: SizeOption[] = [
  {
    id: '1:12',
    label: '1:12',
    title: '1:12 Scale',
    inches: 15,
    centimeters: 38,
    visualPercent: 92,
    description: 'Large display scale with substantial presence and detail.',
  },
  {
    id: '1:18',
    label: '1:18',
    title: '1:18 Scale',
    inches: 10,
    centimeters: 25,
    visualPercent: 78,
    description: 'A popular premium scale for detailed collector models.',
  },
  {
    id: '1:24',
    label: '1:24',
    title: '1:24 Scale',
    inches: 7.5,
    centimeters: 19,
    visualPercent: 66,
    description: 'A versatile display size that balances detail and space.',
  },
  {
    id: '1:32',
    label: '1:32',
    title: '1:32 Scale',
    inches: 5.5,
    centimeters: 14,
    visualPercent: 56,
    description: 'A medium format that fits comfortably into most displays.',
  },
  {
    id: '1:43',
    label: '1:43',
    title: '1:43 Scale',
    inches: 4.25,
    centimeters: 11,
    visualPercent: 47,
    description: 'A classic collector scale with a compact footprint.',
  },
  {
    id: '1:64',
    label: '1:64',
    title: '1:64 Scale',
    inches: 3,
    centimeters: 7.6,
    visualPercent: 38,
    description: 'A compact and widely collected scale for cars and dioramas.',
  },
  {
    id: '1:87',
    label: '1:87',
    title: '1:87 Scale',
    inches: 2,
    centimeters: 5,
    visualPercent: 30,
    description: 'A miniature scale often paired with detailed model layouts.',
  },
];

const FUNKO_SIZES: SizeOption[] = [
  {
    id: 'bitty',
    label: 'Bitty',
    title: 'Bitty Pop!',
    inches: 0.9,
    centimeters: 2.3,
    visualPercent: 26,
    description: 'The smallest Pop! format, designed for miniature displays.',
  },
  {
    id: 'pocket',
    label: 'Pocket',
    title: 'Pocket Pop!',
    inches: 1.5,
    centimeters: 3.8,
    visualPercent: 34,
    description: 'A small collectible format commonly used for keychains.',
  },
  {
    id: 'standard',
    label: 'Standard',
    title: 'Pop! Standard',
    inches: 4,
    centimeters: 10.2,
    visualPercent: 52,
    description: 'The familiar standard size used by most Pop! collectibles.',
  },
  {
    id: 'super',
    label: 'Super',
    title: 'Super Pop!',
    inches: 6,
    centimeters: 15.2,
    visualPercent: 64,
    description: 'A larger format that stands above standard Pop! figures.',
  },
  {
    id: 'jumbo',
    label: 'Jumbo',
    title: 'Jumbo Pop!',
    inches: 10,
    centimeters: 25.4,
    visualPercent: 80,
    description: 'A statement-size collectible made for prominent displays.',
  },
  {
    id: 'mega',
    label: 'Mega',
    title: 'Mega Pop!',
    inches: 18,
    centimeters: 45.7,
    visualPercent: 96,
    description: 'The largest regular Pop! size for centerpiece collections.',
  },
];

const RULER_MARKS = [0, 0.25, 0.5, 0.75, 1];
const VERTICAL_RULER_MARKS = [0, 0.5, 1];
const MINOR_RULER_MARKS = Array.from({length: 21}, (_, index) => index / 20);

function formatMeasurement(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function ScaleGuide() {
  const [mode, setMode] = useState<GuideMode>('diecast');
  const [diecastScale, setDiecastScale] = useState('1:64');
  const [funkoSize, setFunkoSize] = useState('standard');
  const hoverTimerRef = useRef<number | null>(null);
  const lastWheelAtRef = useRef(0);

  const options = mode === 'diecast' ? DIECAST_SCALES : FUNKO_SIZES;
  const activeId = mode === 'diecast' ? diecastScale : funkoSize;

  const selected = useMemo(
    () => options.find((option) => option.id === activeId) || options[0],
    [activeId, options]
  );

  const selectOption = useCallback(
    (id: string) => {
      if (mode === 'diecast') setDiecastScale(id);
      else setFunkoSize(id);
    },
    [mode]
  );

  const cancelHoverSelection = useCallback(() => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const scheduleHoverSelection = useCallback(
    (id: string) => {
      cancelHoverSelection();

      hoverTimerRef.current = window.setTimeout(() => {
        const isWheelScrolling =
          performance.now() - lastWheelAtRef.current < 180;

        if (!isWheelScrolling) selectOption(id);
        hoverTimerRef.current = null;
      }, 110);
    },
    [cancelHoverSelection, selectOption]
  );

  useEffect(() => {
    function handleWheel() {
      lastWheelAtRef.current = performance.now();
      cancelHoverSelection();
    }

    window.addEventListener('wheel', handleWheel, {passive: true});

    return () => {
      window.removeEventListener('wheel', handleWheel);
      cancelHoverSelection();
    };
  }, [cancelHoverSelection]);

  return (
    <section className="performance-section relative overflow-hidden bg-[#F7F5F0] pb-6 pt-8 md:pb-8 md:pt-10">
      <div className="relative z-10 mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{opacity: 0, y: 12}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.2}}
          transition={{
            duration: 0.42,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
          className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-white px-4 py-2 shadow-sm">
              <Sparkles className="h-4 w-4 text-[#C8A45D]" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#0F5A46]">
                Size Made Simple
              </span>
            </div>

            <h2 className="mb-3 text-4xl font-extrabold tracking-[-0.045em] text-[#111111] md:text-5xl">
              Scale & Size Guide
            </h2>

            <p className="max-w-2xl text-base leading-relaxed text-[#717182]">
              Compare common collectible sizes before choosing the right piece
              for your display.
            </p>
          </div>
        </motion.div>

        <div className="overflow-hidden rounded-[2.25rem] border border-[#DED9CF] bg-white/90 shadow-[0_16px_42px_rgba(17,17,17,0.06)]">
          <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
            <div className="border-b border-[#E4DFD5] p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-8">
              <div
                role="tablist"
                aria-label="Collectible size type"
                className="mb-7 grid grid-cols-2 rounded-2xl bg-[#EDE9E0] p-1.5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'diecast'}
                  onClick={() => {
                    cancelHoverSelection();
                    setMode('diecast');
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold transition-[background-color,color,box-shadow] duration-200 motion-reduce:transition-none ${
                    mode === 'diecast'
                      ? 'bg-[#0F5A46] text-white shadow-[0_8px_22px_rgba(15,90,70,0.22)]'
                      : 'text-[#5F625F] hover:text-[#0F5A46]'
                  }`}
                >
                  <Car className="h-4 w-4" />
                  Diecast Scales
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'funko'}
                  onClick={() => {
                    cancelHoverSelection();
                    setMode('funko');
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold transition-[background-color,color,box-shadow] duration-200 motion-reduce:transition-none ${
                    mode === 'funko'
                      ? 'bg-[#0F5A46] text-white shadow-[0_8px_22px_rgba(15,90,70,0.22)]'
                      : 'text-[#5F625F] hover:text-[#0F5A46]'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  Funko Sizes
                </button>
              </div>

              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0F5A46]">
                  Select a {mode === 'diecast' ? 'scale' : 'size'}
                </p>
                <p className="hidden text-xs font-semibold text-[#8B8D8A] sm:block">
                  Hover or click
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                {options.map((option) => {
                  const isActive = option.id === selected.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => selectOption(option.id)}
                      onPointerEnter={(event) => {
                        if (event.pointerType === 'mouse') {
                          scheduleHoverSelection(option.id);
                        }
                      }}
                      onPointerLeave={cancelHoverSelection}
                      onFocus={() => selectOption(option.id)}
                      className={`rounded-xl border px-3 py-3 text-sm font-extrabold transition-[transform,border-color,background-color,color,box-shadow] duration-200 motion-reduce:transition-none ${
                        isActive
                          ? 'border-[#0F5A46] bg-[#0F5A46] text-white shadow-[0_8px_20px_rgba(15,90,70,0.20)]'
                          : 'border-[#DDD8CE] bg-white text-[#292B29] hover:-translate-y-0.5 hover:border-[#0F5A46]/35 hover:text-[#0F5A46]'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-7 rounded-2xl border border-[#E1DCD2] bg-[#F8F7F3] p-5">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[#0F5A46]">
                        Approximate size
                      </p>
                      <h3 className="text-2xl font-extrabold tracking-tight text-[#111111]">
                        {selected.title}
                      </h3>
                    </div>

                    <Ruler className="h-6 w-6 shrink-0 text-[#C8A45D]" />
                  </div>

                  <p className="mb-3 text-2xl font-black text-[#0F5A46]">
                    {formatMeasurement(selected.inches)} in
                    <span className="mx-2 text-[#C8A45D]">/</span>
                    {formatMeasurement(selected.centimeters)} cm
                  </p>

                  <p className="text-sm leading-relaxed text-[#717182]">
                    {selected.description}
                  </p>
              </div>
            </div>

            <div className="relative flex min-h-[480px] flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_40%,rgba(15,90,70,0.08),transparent_46%),linear-gradient(145deg,#FBFAF7_0%,#F2EEE6_100%)] p-5 sm:p-8">
              <div className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,rgba(17,17,17,0.20)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.20)_1px,transparent_1px)] bg-[size:34px_34px]" />

              <div className="relative z-10 h-[340px] shrink-0 overflow-visible sm:h-[380px] lg:h-[400px]">
                <AnimatePresence mode="wait">
                  {mode === 'diecast' ? (
                    <motion.div
                      key={`diecast-${selected.id}`}
                      initial={{opacity: 0}}
                      animate={{opacity: 1}}
                      exit={{opacity: 0}}
                      transition={{duration: 0.2}}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div
                        className="flex max-w-full flex-col items-center"
                        style={{
                          width: `clamp(170px, ${selected.visualPercent}%, 94%)`,
                        }}
                      >
                        <div className="relative aspect-[3/1] w-full overflow-hidden">
                          <div className="pointer-events-none absolute bottom-[5%] left-1/2 h-[18%] w-[76%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(17,17,17,0.18),transparent_70%)]" />
                          <img
                            src="/images/scale-guide/scale-guide-diecast.png"
                            alt={`Side-view car representing ${selected.title}`}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="absolute left-1/2 top-1/2 z-10 h-auto w-[110%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                          />
                        </div>

                        <div className="mt-3 w-full">
                          <div className="relative h-6 border-t-2 border-[#252825]">
                            {MINOR_RULER_MARKS.map((mark, index) => (
                              <span
                                key={mark}
                                className={`absolute top-0 w-px -translate-x-1/2 bg-[#252825] ${
                                  index % 5 === 0 ? 'h-5' : 'h-2.5 opacity-60'
                                }`}
                                style={{left: `${mark * 100}%`}}
                              />
                            ))}
                          </div>

                          <div className="-mt-0.5 flex items-start justify-between text-[10px] font-bold text-[#5F625F] sm:text-xs">
                            {RULER_MARKS.map((mark, index) => (
                              <span
                                key={mark}
                                className={`whitespace-nowrap ${
                                  index === 1 || index === 3 ? 'hidden sm:inline' : ''
                                }`}
                              >
                                {formatMeasurement(selected.inches * mark)} in
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`funko-${selected.id}`}
                      initial={{opacity: 0}}
                      animate={{opacity: 1}}
                      exit={{opacity: 0}}
                      transition={{duration: 0.2}}
                      className="absolute inset-0 flex items-end justify-center"
                    >
                      <div
                        className="flex max-h-full items-end gap-5 sm:gap-7"
                        style={{
                          height: `clamp(88px, ${selected.visualPercent}%, 96%)`,
                        }}
                      >
                        <div className="relative h-full aspect-[0.725/1] overflow-hidden">
                          <div className="pointer-events-none absolute bottom-0 left-1/2 h-[7%] w-[72%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(17,17,17,0.16),transparent_72%)]" />
                          <img
                            src="/images/scale-guide/scale-guide-funko.png"
                            alt={`Vinyl figure representing ${selected.title}`}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="absolute -top-[1.5%] left-1/2 z-10 h-[112%] w-auto max-w-none -translate-x-1/2 object-contain object-top"
                          />
                        </div>

                        <div className="relative h-full w-20 border-l-2 border-[#252825]">
                          {VERTICAL_RULER_MARKS.map((mark) => (
                            <div
                              key={mark}
                              className={`absolute left-0 flex items-center ${
                                mark === 0
                                  ? ''
                                  : mark === 1
                                    ? 'translate-y-full'
                                    : 'translate-y-1/2'
                              }`}
                              style={{bottom: `${mark * 100}%`}}
                            >
                              <div className={`h-px bg-[#252825] ${mark === 0 || mark === 1 ? 'w-6' : 'w-4'}`} />
                              <span className="ml-2 whitespace-nowrap text-[10px] font-bold text-[#5F625F] sm:text-xs">
                                {formatMeasurement(selected.inches * mark)} in
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative z-10 mt-4 flex shrink-0 items-start gap-2 rounded-xl border border-[#DCD7CD] bg-white/90 px-4 py-3 text-xs leading-relaxed text-[#717182]">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0F5A46]" />
                <p>
                  Measurements are approximate. Actual dimensions vary by
                  vehicle, character, pose, and manufacturer. Check each product
                  description for exact sizing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}