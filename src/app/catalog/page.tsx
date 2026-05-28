import { PageHero } from '../components/PageHero';

export default function CatalogPage() {
  return (
    <div>
      <PageHero
        title="Catalog"
        description="Browse all premium products available from IL Distributions LLC."
      />

      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-4">
          All Products
        </h2>

        <p className="text-[#717182]">
          Your Shopify products will appear here soon.
        </p>
      </section>
    </div>
  );
}
