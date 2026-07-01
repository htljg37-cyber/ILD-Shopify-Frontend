import { CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';
import { useState } from 'react';

function htmlToLines(html: string) {
  const div = document.createElement('div');
  div.innerHTML = html || '';

  div.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));

  div.querySelectorAll('li').forEach((li) => {
    li.textContent = `\n• ${li.textContent || ''}`;
  });

  div.querySelectorAll('p, div, ul, ol').forEach((el) => {
    el.append('\n');
  });

  return (div.textContent || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanBullet(line: string) {
  return line
    .replace(/^[-•✓✔✅\*]\s*/, '')
    .replace(/^.*?(features|feature|highlights):?\s*/i, '')
    .trim();
}

function isFeatureLine(line: string) {
  return /features|feature|highlights/i.test(line);
}

function extractFeatureItems(line: string) {
  const cleaned = line
    .replace(/^.*?(features|feature|highlights):?\s*/i, '')
    .trim();

  return cleaned
    .split(/(?:•|✓|✔|✅|🌻|🌹|🦋|👑|💝|🌿|⏳|💧|🎁| - )/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2);
}

function isBullet(line: string) {
  return /^[-•✓✔✅\*]\s+/.test(line.trim());
}

function isSpec(line: string) {
  return /^[A-Za-z0-9 &/().-]{2,35}:\s+.+/.test(line.trim());
}

function Accordion({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-[#EAE7DF] bg-white/80 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#0F5A46]">
          {title}
        </span>

        <ChevronDown
          className={`h-5 w-5 text-[#0F5A46] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && <div className="px-5 pb-5">{children}</div>}
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
  const lines = htmlToLines(html);
  const text = lines.join(' ');
  const lowerText = text.toLowerCase();

  const featureSectionItems = lines.flatMap((line, index) => {
    if (!isFeatureLine(line)) return [];

    const sameLineItems = extractFeatureItems(line);
    const nextLine = lines[index + 1] || '';
    const nextLineItems = extractFeatureItems(nextLine);

    return [...sameLineItems, ...nextLineItems];
  });

  const bulletFeatures = lines.filter(isBullet).map(cleanBullet);

  const bulletLines = [...featureSectionItems, ...bulletFeatures].filter(
    (item, index, array) => item && array.indexOf(item) === index
  );

  const specLines = lines.filter(isSpec);

  const normalLines = lines.filter(
    (line) =>
      !isBullet(line) &&
      !isSpec(line) &&
      !isFeatureLine(line) &&
      !bulletLines.includes(line) &&
      !/^(features|feature|specifications|description|care|package includes):?$/i.test(
        line
      )
  );

  const specs = specLines.map((line) => {
    const [label, ...rest] = line.split(':');

    return {
      label: label.trim(),
      value: rest.join(':').trim(),
    };
  });

  const isFlower =
    tags.includes('shipping_local') ||
    lowerText.includes('preserved rose') ||
    lowerText.includes('flower');

  const isDiecast =
    lowerText.includes('diecast') ||
    lowerText.includes('scale') ||
    lowerText.includes('model car');

  return (
    <div className="mb-8 space-y-4">
      <div className="rounded-3xl border border-[#EAE7DF] bg-[#F8F7F3] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#C8A45D]" />

          <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#0F5A46]">
            Product Overview
          </h3>
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-[#717182]">
          {normalLines.length > 0 ? (
            normalLines
              .slice(0, 3)
              .map((line, index) => <p key={index}>{line}</p>)
          ) : (
            <p>Key product details are organized below for quick review.</p>
          )}
        </div>
      </div>

      {bulletLines.length > 0 && (
        <Accordion
          title={
            isFlower
              ? 'Floral Highlights'
              : isDiecast
                ? 'Collector Highlights'
                : 'Product Highlights'
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {bulletLines.slice(0, 12).map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-2 rounded-xl bg-[#0F5A46]/5 px-3 py-3 text-sm font-semibold text-[#111111]"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F5A46]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Accordion>
      )}

      {specs.length > 0 && (
        <Accordion title="Specifications" defaultOpen={false}>
          <div className="grid gap-3 sm:grid-cols-2">
            {specs.slice(0, 10).map((spec, index) => (
              <div
                key={index}
                className="rounded-xl border border-[#EAE7DF] bg-[#F8F7F3] p-3"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#717182]">
                  {spec.label}
                </p>

                <p className="mt-1 text-sm font-extrabold text-[#111111]">
                  {spec.value}
                </p>
              </div>
            ))}
          </div>
        </Accordion>
      )}

      <Accordion
        title={isFlower ? 'Care & Display' : 'Shipping & Service'}
        defaultOpen={false}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {(isFlower
            ? [
                'No watering required',
                'Keep away from direct sunlight',
                'Avoid humidity',
                'Indoor display recommended',
              ]
            : [
                'Carefully packed',
                'Tracking included',
                'Secure checkout',
                'Quality inspected before shipping',
              ]
          ).map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-xl bg-[#F8F7F3] px-3 py-3 text-sm font-semibold text-[#111111]"
            >
              <CheckCircle2 className="h-4 w-4 text-[#0F5A46]" />
              {item}
            </div>
          ))}
        </div>
      </Accordion>
    </div>
  );
}