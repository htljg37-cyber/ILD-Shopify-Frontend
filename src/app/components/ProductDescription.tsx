import { CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type DescriptionSection = 'overview' | 'features' | 'specifications' | 'care';

type Specification = {
  label: string;
  value: string;
};

const specificationLabels = [
  'brand',
  'scale',
  'material',
  'packaging',
  'recommended age',
  'age',
  'size',
  'dimensions',
  'length',
  'approximate length',
  'color',
  'condition',
  'manufacturer',
  'model',
  'vehicle type',
  'series',
  'edition',
  'year',
  'country of manufacture',
  'please note',
  'package includes',
];

function htmlToLines(html: string) {
  if (!html) return [];

  const div = document.createElement('div');
  div.innerHTML = html;

  div.querySelectorAll('br').forEach((br) => {
    br.replaceWith('\n');
  });

  div.querySelectorAll('li').forEach((li) => {
    const text = li.textContent?.trim() || '';

    li.textContent = text ? `\n• ${text}\n` : '';
  });

  div
    .querySelectorAll('p, div, ul, ol, h1, h2, h3, h4, h5, h6')
    .forEach((element) => {
      element.append('\n');
    });

  return (div.textContent || '')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function normalizeHeading(line: string) {
  return line
    .toLowerCase()
    .replace(/[✨🌻🌹🦋👑💝🌿⏳💧🎁🚗🏁📦]/gu, '')
    .replace(/[:\-–—]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isFeaturesHeading(line: string) {
  const heading = normalizeHeading(line);

  return [
    'feature',
    'features',
    'highlight',
    'highlights',
    'product highlights',
    'collector highlights',
    'floral highlights',
  ].includes(heading);
}

function isSpecificationsHeading(line: string) {
  const heading = normalizeHeading(line);

  return [
    'specification',
    'specifications',
    'product specifications',
    'details',
    'product details',
  ].includes(heading);
}

function isCareHeading(line: string) {
  const heading = normalizeHeading(line);

  return [
    'care',
    'care instructions',
    'care display',
    'care and display',
    'display care',
  ].includes(heading);
}

function isDescriptionHeading(line: string) {
  const heading = normalizeHeading(line);

  return [
    'description',
    'product description',
    'overview',
    'product overview',
  ].includes(heading);
}

function isBullet(line: string) {
  return /^(\s*[-•✓✔✅*]\s*)+/.test(line);
}

function cleanBullet(line: string) {
  return line
    .replace(/^(\s*[-•✓✔✅*]\s*)+/, '')
    .replace(/^(features?|highlights?):?\s*/i, '')
    .trim();
}

function splitFeatureItems(line: string) {
  const cleanedLine = line
    .replace(/^(features?|highlights?):?\s*/i, '')
    .trim();

  if (!cleanedLine) return [];

  const items = cleanedLine
    .split(/\s*(?:•|✓|✔|✅)\s*/)
    .map(cleanBullet)
    .filter((item) => item.length > 1);

  return items.length > 0 ? items : [cleanBullet(cleanedLine)];
}

function parseSpecification(line: string): Specification | null {
  const match = line.match(/^([^:]{2,40}):\s*(.+)$/);

  if (!match) return null;

  const label = match[1].trim();
  const value = match[2].trim();
  const normalizedLabel = label.toLowerCase();

  const isRecognizedLabel = specificationLabels.some(
    (allowedLabel) => normalizedLabel === allowedLabel
  );

  if (!isRecognizedLabel || !value) return null;

  return {
    label,
    value,
  };
}

function removeDuplicates(items: string[]) {
  return items.filter((item, index, array) => {
    const normalizedItem = item.toLowerCase().trim();

    return (
      normalizedItem.length > 1 &&
      array.findIndex(
        (candidate) => candidate.toLowerCase().trim() === normalizedItem
      ) === index
    );
  });
}

function parseDescription(html: string) {
  const lines = htmlToLines(html);

  const overview: string[] = [];
  const features: string[] = [];
  const specifications: Specification[] = [];
  const care: string[] = [];

  let currentSection: DescriptionSection = 'overview';

  lines.forEach((line) => {
    if (isDescriptionHeading(line)) {
      currentSection = 'overview';
      return;
    }

    if (isFeaturesHeading(line)) {
      currentSection = 'features';
      return;
    }

    if (isSpecificationsHeading(line)) {
      currentSection = 'specifications';
      return;
    }

    if (isCareHeading(line)) {
      currentSection = 'care';
      return;
    }

    const specification = parseSpecification(line);

    /*
     * El formato recomendado no necesita obligatoriamente un encabezado
     * "Specifications:". Cuando aparece Brand:, Scale:, Material:, etc.,
     * el parser cambia automáticamente a esa sección.
     */
    if (specification) {
      currentSection = 'specifications';
      specifications.push(specification);
      return;
    }

    if (currentSection === 'features') {
      const extractedFeatures = isBullet(line)
        ? splitFeatureItems(line)
        : splitFeatureItems(line);

      features.push(...extractedFeatures);
      return;
    }

    if (currentSection === 'care') {
      care.push(cleanBullet(line));
      return;
    }

    if (currentSection === 'specifications') {
      /*
       * Si aparece texto normal después de las especificaciones sin el
       * encabezado Care:, no lo convertimos en specification.
       */
      care.push(cleanBullet(line));
      currentSection = 'care';
      return;
    }

    overview.push(line);
  });

  return {
    overview: removeDuplicates(overview),
    features: removeDuplicates(features),
    specifications: specifications.filter(
      (specification, index, array) =>
        array.findIndex(
          (candidate) =>
            candidate.label.toLowerCase() ===
              specification.label.toLowerCase() &&
            candidate.value.toLowerCase() ===
              specification.value.toLowerCase()
        ) === index
    ),
    care: removeDuplicates(care),
  };
}

function Accordion({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#EAE7DF] bg-white/80 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors duration-300 hover:bg-[#0F5A46]/[0.03]"
      >
        <span className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#0F5A46]">
          {title}
        </span>

        <ChevronDown
          className={`h-5 w-5 text-[#0F5A46] transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${
          open
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ProductDescription({
  html,
  tags = [],
}: {
  html: string;
  tags?: string[];
}) {
  const parsed = parseDescription(html);

  const fullText = htmlToLines(html).join(' ').toLowerCase();
  const normalizedTags = tags.map((tag) => tag.toLowerCase());

  const isFlower =
    normalizedTags.includes('shipping_local') ||
    fullText.includes('preserved rose') ||
    fullText.includes('preserved flower') ||
    fullText.includes('floral arrangement') ||
    fullText.includes('sunflower');

  const isDiecast =
    fullText.includes('diecast') ||
    fullText.includes('model car') ||
    fullText.includes('scale model') ||
    parsed.specifications.some(
      (specification) => specification.label.toLowerCase() === 'scale'
    );

  const featureTitle = isFlower
    ? 'Floral Highlights'
    : isDiecast
      ? 'Collector Highlights'
      : 'Product Highlights';

  const careTitle =
    parsed.care.length > 0
      ? 'Care & Display'
      : isFlower
        ? 'Care & Display'
        : 'Shipping & Service';

  const fallbackCareItems = isFlower
    ? [
        'No watering required',
        'Keep away from direct sunlight',
        'Avoid excessive humidity',
        'Indoor display recommended',
      ]
    : [
        'Carefully packed',
        'Tracking included',
        'Secure checkout',
        'Quality inspected before shipping',
      ];

  const careItems =
    parsed.care.length > 0 ? parsed.care : fallbackCareItems;

  return (
    <div className="mb-8 space-y-4">
      <div className="rounded-3xl border border-[#EAE7DF] bg-[#F8F7F3] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 shrink-0 text-[#C8A45D]" />

          <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#0F5A46]">
            Product Overview
          </h3>
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-[#717182]">
          {parsed.overview.length > 0 ? (
            parsed.overview.map((line, index) => (
              <p
                key={`${line}-${index}`}
                className={
                  index === 0 && parsed.overview.length > 1
                    ? 'font-semibold text-[#5F6170]'
                    : undefined
                }
              >
                {line}
              </p>
            ))
          ) : (
            <p>Key product details are organized below for quick review.</p>
          )}
        </div>
      </div>

      {parsed.features.length > 0 && (
        <Accordion title={featureTitle}>
          <div className="grid gap-3 sm:grid-cols-2">
            {parsed.features.slice(0, 16).map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex items-start gap-2 rounded-xl bg-[#0F5A46]/5 px-3 py-3 text-sm font-semibold leading-relaxed text-[#111111]"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F5A46]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Accordion>
      )}

      {parsed.specifications.length > 0 && (
        <Accordion title="Specifications" defaultOpen={false}>
          <div className="grid gap-3 sm:grid-cols-2">
            {parsed.specifications.slice(0, 16).map((specification, index) => (
              <div
                key={`${specification.label}-${index}`}
                className="rounded-xl border border-[#EAE7DF] bg-[#F8F7F3] p-3"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#717182]">
                  {specification.label}
                </p>

                <p className="mt-1 text-sm font-extrabold leading-relaxed text-[#111111]">
                  {specification.value}
                </p>
              </div>
            ))}
          </div>
        </Accordion>
      )}

      <Accordion title={careTitle} defaultOpen={false}>
        <div
          className={
            parsed.care.length > 0
              ? 'space-y-3'
              : 'grid gap-3 sm:grid-cols-2'
          }
        >
          {careItems.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex items-start gap-2 rounded-xl bg-[#F8F7F3] px-3 py-3 text-sm font-semibold leading-relaxed text-[#111111]"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F5A46]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Accordion>
    </div>
  );
}