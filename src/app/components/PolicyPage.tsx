interface PolicyPageProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export function PolicyPage({
  title,
  lastUpdated,
  children,
}: PolicyPageProps) {
  return (
    <>
      <section className="bg-gradient-to-br from-[#071A15] via-[#0B0F0E] to-[#111111] py-20 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <span className="inline-flex items-center rounded-full border border-[#0F5A46]/40 bg-[#0F5A46]/20 px-4 py-2 text-sm text-white/90 mb-6">
              IL Distributions LLC
            </span>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {title}
            </h1>

            {lastUpdated && (
              <p className="text-white/60">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#FAFAFA] py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
            <div className="space-y-8 text-[#444444] leading-8">
              {children}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100">
              <p className="text-sm text-[#717182]">
                For questions about this policy, please contact{' '}
                <a
                  href="mailto:support@ildistributions.com"
                  className="text-[#0F5A46] font-semibold hover:underline"
                >
                  support@ildistributions.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}