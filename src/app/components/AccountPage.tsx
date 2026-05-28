import { User, ShoppingBag, Mail } from 'lucide-react';
import { Button } from './ui/button';

export function AccountPage() {
  return (
    <section className="bg-[#FAFAFA] py-16 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          <div className="h-16 w-16 rounded-full bg-[#0F5A46]/10 flex items-center justify-center mx-auto mb-6">
            <User className="h-8 w-8 text-[#0F5A46]" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-[#111111] mb-4">
            Customer Account
          </h1>

          <p className="text-[#717182] mb-8">
            Customer accounts will be available soon. For now, you can track
            your order, contact support, or continue shopping.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a href="/track-order">
              <Button variant="outline" className="w-full">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Track Order
              </Button>
            </a>

            <a href="/contact">
              <Button variant="outline" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Contact
              </Button>
            </a>

            <a href="/catalog">
              <Button className="w-full bg-[#0F5A46] hover:bg-[#0F5A46]/90 text-white">
                Continue Shopping
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}