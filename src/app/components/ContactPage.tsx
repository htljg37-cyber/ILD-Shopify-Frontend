import {memo, useEffect, useRef, useState} from 'react';
import type {FormEvent} from 'react';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  X,
} from 'lucide-react';

type SubmitStatus = 'idle' | 'sending' | 'success' | 'error';

const contactDetails = [
  {
    icon: Mail,
    title: 'Email Support',
    text: 'support@ildistributions.com',
    href: 'mailto:support@ildistributions.com',
  },
  {
    icon: MapPin,
    title: 'Location',
    text: 'California, United States',
  },
  {
    icon: Clock,
    title: 'Business Hours',
    text: 'Monday – Friday: 9 AM – 6 PM PST',
  },
];

const ContactDetail = memo(function ContactDetail({
  icon: Icon,
  title,
  text,
  href,
}: (typeof contactDetails)[number]) {
  const content = (
    <>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#E0C575]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="font-extrabold text-white">{title}</h3>
        <p className="mt-1 break-words text-sm leading-relaxed text-[#BDCBC5]">
          {text}
        </p>
      </div>
    </>
  );

  return href ? (
    <a
      href={href}
      className="flex gap-4 border-b border-white/10 py-5 first:pt-0 last:border-0 last:pb-0 hover:[&_h3]:text-[#E0C575]"
    >
      {content}
    </a>
  ) : (
    <div className="flex gap-4 border-b border-white/10 py-5 first:pt-0 last:border-0 last:pb-0">
      {content}
    </div>
  );
});

const inputClass =
  'w-full rounded-xl border border-[#C6CEC8] bg-white px-4 text-sm text-[#17251F] outline-none transition-colors placeholder:text-[#8B9690] hover:border-[#97AAA0] focus:border-[#0F5A46] focus:ring-2 focus:ring-[#0F5A46]/15';

export function ContactPage() {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const hideMessageTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hideMessageTimer.current !== null) {
        window.clearTimeout(hideMessageTimer.current);
      }
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status === 'sending') return;

    setStatus('sending');
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(
        'https://formsubmit.co/ajax/support@ildistributions.com',
        {
          method: 'POST',
          body: formData,
          headers: {Accept: 'application/json'},
        }
      );

      if (!response.ok) throw new Error('Form submission failed');

      form.reset();
      setStatus('success');

      if (hideMessageTimer.current !== null) {
        window.clearTimeout(hideMessageTimer.current);
      }

      hideMessageTimer.current = window.setTimeout(() => {
        setStatus('idle');
        hideMessageTimer.current = null;
      }, 6000);
    } catch (error) {
      console.error('Unable to send contact form:', error);
      setStatus('error');
    }
  }

  return (
    <main className="min-h-screen bg-[#CDD6CF] px-4 py-8 sm:px-6 md:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <section className="overflow-hidden rounded-[1.75rem] border border-[#AEBBB4] bg-[#F7F5F0] shadow-[0_12px_28px_rgba(24,48,40,0.1)]">
          <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
            <div className="relative bg-[#123F34] px-6 py-8 sm:px-8 md:p-10 lg:p-12">
              <div className="absolute inset-y-0 right-0 hidden w-px bg-white/10 lg:block" />

              <div className="mb-8 max-w-md">
                <div className="mb-4 flex items-center gap-2 text-[#D8BE6B]">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-[0.14em]">
                    Customer Support
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-white sm:text-4xl">
                  How can we help?
                </h1>

                <p className="mt-3 text-sm leading-relaxed text-[#C5D0CB] sm:text-base">
                  Contact us about a product, an existing order, wholesale
                  inquiries, or general support.
                </p>
              </div>

              <div>
                {contactDetails.map((detail) => (
                  <ContactDetail key={detail.title} {...detail} />
                ))}
              </div>

              <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#E0C575]" />
                <p className="text-sm leading-relaxed text-[#BDCBC5]">
                  For order questions, include your order number so we can help
                  you faster.
                </p>
              </div>
            </div>

            <div className="px-6 py-8 sm:px-8 md:p-10 lg:p-12">
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#0F5A46]">
                  Send a message
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.025em] text-[#17251F] sm:text-3xl">
                  Tell us what you need
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#68756E]">
                  Complete the form and our team will respond as soon as
                  possible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <input type="hidden" name="_captcha" value="false" />
                <input
                  type="hidden"
                  name="_subject"
                  value="New Contact Form Message - IL Distributions LLC"
                />
                <input type="hidden" name="_template" value="table" />

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-2 block text-sm font-bold text-[#17251F]"
                    >
                      Full Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Your full name"
                      className={`${inputClass} h-12`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block text-sm font-bold text-[#17251F]"
                    >
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      placeholder="your@email.com"
                      className={`${inputClass} h-12`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="mb-2 block text-sm font-bold text-[#17251F]"
                  >
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    name="subject"
                    required
                    placeholder="Order question, support, wholesale..."
                    className={`${inputClass} h-12`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block text-sm font-bold text-[#17251F]"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    placeholder="Write your message here..."
                    className={`${inputClass} min-h-[132px] resize-y py-3`}
                  />
                </div>

                {status === 'error' && (
                  <div
                    role="alert"
                    className="rounded-xl border border-[#D9AAA4] bg-[#FFF3F1] px-4 py-3 text-sm font-semibold text-[#8E342B]"
                  >
                    The message could not be sent. Please try again or email us
                    directly at support@ildistributions.com.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-[#0F5A46] px-5 text-sm font-bold text-white transition-colors hover:bg-[#126B54] focus:outline-none focus:ring-2 focus:ring-[#0F5A46]/30 focus:ring-offset-2 active:bg-[#0C4C3B] disabled:cursor-wait disabled:opacity-65"
                >
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>

      {status === 'success' && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-4 right-4 z-[9999] mx-auto max-w-md rounded-2xl border border-[#315D50] bg-[#102E27] p-4 text-white shadow-[0_12px_28px_rgba(17,40,33,0.22)] sm:left-auto sm:right-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1B6B55]">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold">Message sent successfully</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">
                Thank you for contacting IL Distributions. We will respond as
                soon as possible.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              aria-label="Close confirmation"
              className="rounded-md p-1 text-white/65 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}