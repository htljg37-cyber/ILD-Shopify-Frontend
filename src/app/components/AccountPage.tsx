import {useEffect, useState} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  LogIn,
  Mail,
  ShieldCheck,
  ShoppingBag,
  UserCircle,
  UserPlus,
} from 'lucide-react';

const shopifyAuthLoginUrl = 'https://www.ildistributions.com/api/auth/login';
const shopifyProfileUrl = 'https://account.ildistributions.com/profile';

type Customer = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: {
    emailAddress?: string | null;
  } | null;
};

type AccountState =
  | {status: 'loading'; customer: null}
  | {status: 'authenticated'; customer: Customer}
  | {status: 'guest'; customer: null};

const primaryLinkClass =
  'flex min-h-12 items-center justify-center rounded-xl bg-[#0F5A46] px-5 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#126B54] focus:outline-none focus:ring-2 focus:ring-[#0F5A46]/30 focus:ring-offset-2 active:bg-[#0C4C3B]';

const secondaryLinkClass =
  'flex min-h-12 items-center justify-center rounded-xl border border-[#C6CEC8] bg-white px-4 py-3 text-center text-sm font-bold text-[#17251F] transition-colors hover:border-[#0F5A46] hover:bg-[#F2F6F3] hover:text-[#0F5A46] focus:outline-none focus:ring-2 focus:ring-[#0F5A46]/20';

async function readJsonResponse(response: Response) {
  const responseText = await response.text();
  if (!responseText.trim()) return null;

  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
}

export function AccountPage() {
  const [account, setAccount] = useState<AccountState>({
    status: 'loading',
    customer: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadCustomer() {
      try {
        const response = await fetch('/api/customer/me', {
          signal: controller.signal,
          credentials: 'include',
          headers: {Accept: 'application/json'},
        });
        const data = await readJsonResponse(response);

        if (controller.signal.aborted) return;

        if (response.ok && data?.isLoggedIn && data?.customer) {
          setAccount({status: 'authenticated', customer: data.customer});
          return;
        }

        if (response.status !== 401 && response.status !== 403) {
          console.warn(
            `Customer session could not be verified (${response.status}).`
          );
        }

        setAccount({status: 'guest', customer: null});
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn('Customer session request was unavailable.', error);
          setAccount({status: 'guest', customer: null});
        }
      }
    }

    void loadCustomer();
    return () => controller.abort();
  }, []);

  const customer =
    account.status === 'authenticated' ? account.customer : null;
  const customerEmail = customer?.emailAddress?.emailAddress || '';
  const fullName = [customer?.firstName, customer?.lastName]
    .filter(Boolean)
    .join(' ');
  const customerName = fullName || customerEmail || 'Customer';

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#CDD6CF] px-4 py-8 sm:px-6 md:py-12 lg:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <section className="overflow-hidden rounded-[1.75rem] border border-[#AEBBB4] bg-[#F7F5F0] shadow-[0_12px_28px_rgba(24,48,40,0.09)]">
          <header className="bg-[#123F34] px-6 py-7 sm:px-8 md:px-10 md:py-9">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#E0C575]">
                <UserCircle className="h-7 w-7" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#D8BE6B]">
                  Customer Account
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] text-white sm:text-4xl">
                  {customer ? `Welcome, ${customerName}` : 'Your account'}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#C5D0CB] sm:text-base">
                  {customer
                    ? 'Your Shopify customer account is connected. Manage your profile and return to the products you saved.'
                    : 'Sign in or create an account through Shopify to manage your profile, orders, and saved products.'}
                </p>
              </div>
            </div>
          </header>

          <div className="p-6 sm:p-8 md:p-10" aria-live="polite">
            {account.status === 'loading' ? (
              <div aria-label="Loading account" className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-3">
                  <div className="h-5 w-32 rounded bg-[#D9E0DB]" />
                  <div className="h-8 max-w-sm rounded bg-[#E0E5E1]" />
                  <div className="h-12 rounded-xl bg-[#D9E0DB]" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="h-12 rounded-xl bg-[#E0E5E1]" />
                    <div className="h-12 rounded-xl bg-[#E0E5E1]" />
                  </div>
                </div>
                <div className="min-h-44 rounded-2xl border border-[#CFD7D1] bg-[#E8ECE8]" />
              </div>
            ) : customer ? (
              <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#0F5A46]">
                    Account access
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.025em] text-[#17251F] sm:text-3xl">
                    Everything connected in one place
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#68756E]">
                    Signed in as{' '}
                    <span className="font-bold text-[#17251F]">
                      {customerEmail || customerName}
                    </span>
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <a
                      href={shopifyProfileUrl}
                      className={`${primaryLinkClass} sm:col-span-2`}
                    >
                      <UserCircle className="mr-2 h-5 w-5" />
                      Manage Shopify Profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                    <a href="/wishlist" className={secondaryLinkClass}>
                      <Heart className="mr-2 h-5 w-5" />
                      Wishlist
                    </a>
                    <a href="/track-order" className={secondaryLinkClass}>
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Track Order
                    </a>
                    <a href="/contact" className={secondaryLinkClass}>
                      <Mail className="mr-2 h-5 w-5" />
                      Contact Support
                    </a>
                    <a href="/" className={secondaryLinkClass}>
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Continue Shopping
                    </a>
                  </div>
                </div>

                <aside className="rounded-2xl border border-[#C8D2CB] bg-[#E8EFEA] p-5 sm:p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F5A46] text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-extrabold text-[#17251F]">
                    Secured by Shopify
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#5F6F66]">
                    Your login, registration, profile information, and order
                    history are managed through Shopify Customer Accounts.
                  </p>
                  <div className="mt-5 border-t border-[#C8D2CB] pt-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#68756E]">
                      Connected account
                    </p>
                    <p className="mt-1 break-all text-sm font-bold text-[#0F5A46]">
                      {customerEmail || customerName}
                    </p>
                  </div>
                </aside>
              </div>
            ) : (
              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#E2EAE5] text-[#0F5A46]">
                  <LogIn className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-2xl font-extrabold tracking-[-0.025em] text-[#17251F] sm:text-3xl">
                  Sign in to your customer account
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#68756E]">
                  Shopify securely handles account access and registration, so
                  your profile stays connected to your orders and wishlist.
                </p>
                <div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2">
                  <a href={shopifyAuthLoginUrl} className={primaryLinkClass}>
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In
                  </a>
                  <a href={shopifyAuthLoginUrl} className={secondaryLinkClass}>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Create Account
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}