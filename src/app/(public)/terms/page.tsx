import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | YellowRiver",
};

export default function TermsPage() {
  return (
    <div>
      <section className="bg-charcoal relative py-20 sm:py-28">
        <div className="bg-mesh-dark absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Terms of Service
          </h1>
          <div className="mx-auto mt-4 w-16 h-0.5 bg-gold" />
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 prose prose-warm">
          <p className="text-warm-500">Last updated: April 2026</p>

          <h2 className="font-display text-xl font-bold text-warm-900 mt-8">1. Acceptance of Terms</h2>
          <p className="text-warm-700 mt-2">
            By accessing and using the YellowRiver website, you agree to be bound by these
            Terms of Service and all applicable laws and regulations.
          </p>

          <h2 className="font-display text-xl font-bold text-warm-900 mt-8">2. Rental Applications</h2>
          <p className="text-warm-700 mt-2">
            Submitting a rental application does not guarantee approval. All applications are
            subject to review, background checks, and landlord approval. Application information
            must be accurate and truthful.
          </p>

          <h2 className="font-display text-xl font-bold text-warm-900 mt-8">3. User Accounts</h2>
          <p className="text-warm-700 mt-2">
            You are responsible for maintaining the confidentiality of your account credentials.
            You agree to notify us immediately of any unauthorized access to your account.
          </p>

          <h2 className="font-display text-xl font-bold text-warm-900 mt-8">4. Contact Us</h2>
          <p className="text-warm-700 mt-2">
            For questions about these Terms, contact us at{" "}
            <a href="mailto:info@yellowriver.com" className="text-gold hover:text-gold-dark">
              info@yellowriver.com
            </a>.
          </p>
        </div>
      </section>
    </div>
  );
}
