import { useState } from 'react';
import {
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  X,
  ArrowRight,
  Sparkles,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { Button } from './ui/button';

export function ContactPage() {
  const [sending, setSending] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(
        'https://formsubmit.co/ajax/support@ildistributions.com',
        {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Form submission failed');

      form.reset();
      setToastVisible(true);

      setTimeout(() => setToastVisible(false), 6000);
    } catch (error) {
      alert('Something went wrong. Please try again or email us directly.');
    } finally {
      setSending(false);
    }
  }

  const inputClass =
    'w-full rounded-2xl border border-[#EAE7DF] bg-[#F8F7F3] px-4 py-3 text-sm outline-none transition-all duration-300 hover:bg-white focus:border-[#0F5A46]/40 focus:bg-white focus:shadow-[0_12px_30px_rgba(15,90,70,0.10)]';

  return (
    <section className="relative overflow-hidden py-12 md:py-20 bg-[radial-gradient(circle_at_10%_10%,rgba(15,90,70,0.07),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(200,164,93,0.10),transparent_28%),linear-gradient(180deg,#FAFAFA_0%,#F6F4EF_100%)]">
      <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="rounded-[2rem] border border-[#EAE7DF] bg-white/85 p-6 shadow-[0_18px_55px_rgba(17,17,17,0.06)] backdrop-blur-sm md:p-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-[#0F5A46]/8 px-4 py-2">
              <Sparkles className="h-4 w-4 text-[#C8A45D]" />
              <span className="text-sm font-bold text-[#0F5A46]">
                Customer Support
              </span>
            </div>

            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-[#111111] md:text-5xl">
              Contact Us
            </h2>

            <p className="mb-8 text-[#717182] leading-relaxed">
              Have questions about products, orders, wholesale inquiries, or
              support? Our team is here to help.
            </p>

            <div className="space-y-4">
              {[
                [Mail, 'Email Support', 'support@ildistributions.com'],
                [MapPin, 'Location', 'California, United States'],
                [Clock, 'Business Hours', 'Monday - Friday: 9AM - 6PM PST'],
              ].map(([Icon, title, text]) => (
                <div
                  key={title as string}
                  className="group flex items-start gap-4 rounded-2xl border border-[#EAE7DF] bg-[#F8F7F3] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,90,70,0.10)]"
                >
                  <div className="rounded-2xl bg-[#0F5A46]/10 p-3 text-[#0F5A46] transition-all duration-300 group-hover:bg-[#0F5A46] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-bold text-[#111111]">
                      {title as string}
                    </h3>

                    <p className="text-sm text-[#717182]">
                      {text as string}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-[#0F5A46]/10 bg-[#0F5A46]/5 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-[#0F5A46]" />
                <p className="text-sm leading-relaxed text-[#717182]">
                  For order-related questions, include your order number so we
                  can assist you faster.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#EAE7DF] bg-white/90 p-6 shadow-[0_18px_55px_rgba(17,17,17,0.06)] backdrop-blur-sm md:p-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C8A45D]/14 text-[#8A6A24]">
                <MessageCircle className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-[#111111]">
                  Send a Message
                </h2>
                <p className="text-sm text-[#717182]">
                  We will respond as soon as possible.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <input type="hidden" name="_captcha" value="false" />
              <input
                type="hidden"
                name="_subject"
                value="New Contact Form Message - IL Distributions LLC"
              />
              <input type="hidden" name="_template" value="table" />

              <div>
                <label className="mb-2 block text-sm font-bold text-[#111111]">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#111111]">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="your@email.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#111111]">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  placeholder="Order question, support, wholesale..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#111111]">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={6}
                  placeholder="Write your message here..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="h-14 w-full rounded-2xl bg-[#0F5A46] text-base text-white shadow-[0_12px_30px_rgba(15,90,70,0.28)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#126B54] hover:shadow-[0_18px_42px_rgba(15,90,70,0.38)] active:translate-y-0 active:scale-[0.98]"
              >
                {sending ? 'Sending...' : 'Send Message'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {toastVisible && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm rounded-3xl border border-white/10 bg-[#111111] p-5 text-white shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-[#0F5A46] p-2">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1">
              <p className="font-bold text-white">
                Message sent successfully
              </p>

              <p className="mt-1 text-sm text-white/75">
                Thank you for contacting IL Distributions LLC. We will try to
                respond as soon as possible.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToastVisible(false)}
              className="text-white/60 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}