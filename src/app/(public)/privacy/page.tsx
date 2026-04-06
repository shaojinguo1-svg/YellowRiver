import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | YellowRiver",
};

export default function PrivacyPage() {
  return (
    <div>
      <section className="bg-charcoal relative py-20 sm:py-28">
        <div className="bg-mesh-dark absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Privacy Policy
          </h1>
          <div className="mx-auto mt-4 w-16 h-0.5 bg-gold" />
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 prose prose-warm">
          <p className="text-warm-500">Last updated: April 2026</p>

          <h2 className="font-display text-xl font-bold text-warm-900 mt-8">1. Information We Collect</h2>
          <p className="text-warm-700 mt-2">
            We collect personal information you provide when submitting rental applications,
            including your name, email, phone number, employment details, and uploaded documents.
          </p>

          <h2 className="font-display text-xl font-bold text-warm-900 mt-8">2. How We Use Your Information</h2>
          <p className="text-warm-700 mt-2">
            Your information is used to process rental applications, communicate with you about
            available properties, and manage our landlord-tenant relationships.
          </p>

          <h2 className="font-display text-xl font-bold text-warm-900 mt-8">3. Data Security</h2>
          <p className="text-warm-700 mt-2">
            We implement industry-standard security measures to protect your personal information.
            Your data is stored securely and access is restricted to authorized personnel only.
          </p>

          <h2 className="font-display text-xl font-bold text-warm-900 mt-8">4. Contact Us</h2>
          <p className="text-warm-700 mt-2">
            If you have questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:info@yellowriver.com" className="text-gold hover:text-gold-dark">
              info@yellowriver.com
            </a>.
          </p>
        </div>
      </section>
    </div>
  );
}
