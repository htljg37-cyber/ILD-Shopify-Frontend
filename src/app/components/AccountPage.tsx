import { useEffect, useState } from 'react';
import {
  User,
  ShoppingBag,
  Mail,
  LogIn,
  UserPlus,
  ArrowLeft,
  ShieldCheck,
  Heart,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { Button } from './ui/button';

const shopifyAuthLoginUrl = '/api/auth/login';
const shopifyProfileUrl = 'https://account.ildistributions.com/profile';

type Customer = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: {
    emailAddress?: string | null;
  } | null;
};

export function AccountPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);

  useEffect(() => {
    async function loadCustomer() {
      try {
        const response = await fetch('/api/customer/me');
        const data = await response.json();

        if (data?.isLoggedIn && data?.customer) {
          setCustomer(data.customer);
        } else {
          setCustomer(null);
        }
      } catch {
        setCustomer(null);
      } finally {
        setIsLoadingCustomer(false);
      }
    }

    loadCustomer();
  }, []);

  const customerName =
    customer?.firstName ||
    customer?.emailAddress?.emailAddress ||
    'Customer';

  return (
    <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#FAFAFA_0%,#F6F4EF_100%)] py-16 md:py-24">
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(90deg,rgba(17,17,17,0.18)_1px,transparent_1px),linear-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] bg-[size:46px_46px]" />
      <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#0F5A46]/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#C8A45D]/10 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-[#EAE7DF] bg-white/90 shadow-[0_24px_70px_rgba(17,17,17,0.08)] backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-[0.95fr_1.05fr]">
            <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(200,164,93,0.24),transparent_35%),linear-gradient(135deg,#071611_0%,#111111_55%,#0F5A46_100%)] p-8 text-white">
              <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(90deg,rgba(255,255,255,0.28)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.28)_1px,transparent_1px)] bg-[size:38px_38px]" />

              <div className="relative text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                  <User className="h-10 w-10 text-[#C8A45D]" />
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                  {customer ? `Welcome, ${customerName}` : 'My Account'}
                </h1>

                <p className="mt-4 text-sm leading-relaxed text-white/75">
                  {customer
                    ? 'Your Shopify customer account is connected. You can manage your profile, orders, wishlist, and support options from here.'
                    : 'Sign in or create your account through Shopify to manage your profile, orders, and customer information securely.'}
                </p>

                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur-md">
                  <ShieldCheck className="h-4 w-4 text-[#C8A45D]" />
                  Secure Shopify Customer Account
                </div>
              </div>
            </div>

            <div className="p-7 md:p-10">
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#0F5A46]">
                  Customer Access
                </p>

                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#111111] md:text-3xl">
                  {customer
                    ? 'Manage your account'
                    : 'Access your profile and orders'}
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-[#717182]">
                  {isLoadingCustomer
                    ? 'Checking your customer session...'
                    : customer
                    ? `Signed in as ${
                        customer.emailAddress?.emailAddress || customerName
                      }.`
                    : 'Registration and login are handled directly by Shopify, so your customer information stays connected to your orders.'}
                </p>
              </div>

              {isLoadingCustomer ? (
                <div className="rounded-2xl border border-[#EAE7DF] bg-[#F5F5F5] p-5 text-center text-sm font-semibold text-[#717182]">
                  Loading account...
                </div>
              ) : customer ? (
                <div className="grid grid-cols-1 gap-4">
                  <a href={shopifyProfileUrl}>
                    <Button className="h-13 w-full rounded-xl bg-[#0F5A46] text-white shadow-[0_12px_28px_rgba(15,90,70,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0F5A46]/90">
                      <UserCircle className="mr-2 h-4 w-4" />
                      View Profile
                    </Button>
                  </a>

                  <a href="/wishlist">
                    <Button
                      variant="outline"
                      className="h-13 w-full rounded-xl border-[#EAE7DF] bg-white text-[#111111] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0F5A46]/25 hover:bg-[#F5F5F5] hover:text-[#0F5A46]"
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Wishlist
                    </Button>
                  </a>

                  <a href="/">
                    <Button
                      variant="outline"
                      className="h-13 w-full rounded-xl border-[#EAE7DF] bg-white text-[#111111] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0F5A46]/25 hover:bg-[#F5F5F5] hover:text-[#0F5A46]"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Continue Shopping
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <a href={shopifyAuthLoginUrl}>
                    <Button className="h-13 w-full rounded-xl bg-[#0F5A46] text-white shadow-[0_12px_28px_rgba(15,90,70,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0F5A46]/90">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                  </a>

                  <a href={shopifyAuthLoginUrl}>
                    <Button
                      variant="outline"
                      className="h-13 w-full rounded-xl border-[#EAE7DF] bg-white text-[#111111] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0F5A46]/25 hover:bg-[#F5F5F5] hover:text-[#0F5A46]"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </Button>
                  </a>
                </div>
              )}

              <div className="my-8 h-px bg-[#EAE7DF]" />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <a href="/track-order">
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-xl border-[#EAE7DF] bg-white hover:bg-[#F5F5F5] hover:text-[#0F5A46]"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Orders
                  </Button>
                </a>

                <a href="/contact">
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-xl border-[#EAE7DF] bg-white hover:bg-[#F5F5F5] hover:text-[#0F5A46]"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Contact
                  </Button>
                </a>

                <a href="/">
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-xl border-[#EAE7DF] bg-white hover:bg-[#F5F5F5] hover:text-[#0F5A46]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Store
                  </Button>
                </a>
              </div>

              <p className="mt-6 text-center text-xs leading-relaxed text-[#717182]">
                {customer
                  ? 'Your account is connected through Shopify Customer Accounts.'
                  : 'After signing in, Shopify will manage your account access, registration, and order profile securely.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}