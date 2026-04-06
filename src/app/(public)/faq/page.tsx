import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | YellowRiver",
  description:
    "Find answers to frequently asked questions about renting with YellowRiver, including applications, deposits, pet policies, and more.",
};

const FAQ_ITEMS = [
  {
    question: "How do I apply for a rental?",
    answer:
      "You can apply for any of our available listings directly through our website. Browse our listings, select the property you are interested in, and click the 'Apply Now' button. You will be guided through our online application form, which takes about 10-15 minutes to complete. You can also visit our office in person if you prefer assistance with the application.",
  },
  {
    question: "What documents do I need to apply?",
    answer:
      "To complete your rental application, you will need a valid government-issued photo ID (such as a driver's license or passport), proof of income for the past two months (pay stubs or bank statements), your most recent tax return or W-2, and contact information for at least two previous landlords. Self-employed applicants may provide additional documentation such as profit-and-loss statements.",
  },
  {
    question: "How long does the application process take?",
    answer:
      "Most applications are reviewed within 2-3 business days. This includes a background check, credit check, and verification of your employment and rental history. In some cases, the process may take slightly longer if we need to verify additional information. We will keep you informed of the status throughout the review process.",
  },
  {
    question: "Is there an application fee?",
    answer:
      "Yes, there is a non-refundable application fee that covers the cost of background and credit checks. The exact amount varies by property and is clearly stated on each listing page before you begin the application. We strive to keep our fees competitive and transparent.",
  },
  {
    question: "Can I schedule a property tour?",
    answer:
      "Absolutely. We encourage prospective tenants to tour properties before applying. You can schedule a tour directly from any listing page by selecting your preferred date and time, or by contacting our office at (626) 492-6480. We offer tours Monday through Saturday and can accommodate evening appointments upon request.",
  },
  {
    question: "What is the security deposit?",
    answer:
      "Security deposits typically equal one month's rent, though this may vary by property. The deposit is fully refundable at the end of your lease, provided the unit is returned in good condition and all lease terms have been met. A detailed move-in and move-out inspection is conducted to ensure fairness for both parties.",
  },
  {
    question: "Are pets allowed?",
    answer:
      "Pet policies vary by property. Many of our listings are pet-friendly, and each listing page clearly indicates whether pets are accepted. When pets are allowed, there is usually a one-time pet deposit and a modest monthly pet rent. Breed and weight restrictions may apply depending on the property. Contact us if you have specific questions about a listing's pet policy.",
  },
  {
    question: "How do I report maintenance issues?",
    answer:
      "Current tenants can submit maintenance requests through their online tenant portal 24/7. For urgent issues such as water leaks, heating failures, or security concerns, please call our emergency maintenance line at (626) 492-6480. Non-emergency requests are typically addressed within 1-3 business days. We take pride in maintaining our properties to the highest standard.",
  },
  {
    question: "What happens if my application is denied?",
    answer:
      "If your application is not approved, we will send you a written notice explaining the reason. Common reasons include insufficient credit history, unverifiable income, or a negative rental history. If your application is denied based on information from a consumer report, you have the right to request a free copy of that report. We encourage applicants to review their credit before applying.",
  },
  {
    question: "Can I break my lease early?",
    answer:
      "We understand that circumstances change. Early lease termination is possible, but it is subject to the terms outlined in your lease agreement. In most cases, you will need to provide at least 60 days written notice and pay an early termination fee, which is typically equivalent to two months' rent. We recommend contacting our office to discuss your specific situation, as we work with tenants to find the best possible resolution.",
  },
];

export default function FAQPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-charcoal relative py-20 sm:py-28">
        <div className="bg-mesh-dark absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-medium mb-4">
            Common Questions
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <div className="mx-auto mt-4 w-16 h-0.5 bg-gold" />
          <p className="mt-6 text-lg text-warm-300 max-w-2xl mx-auto">
            Everything you need to know about renting with YellowRiver. Can not
            find what you are looking for? Feel free to contact our team.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-warm-200">
                <AccordionTrigger className="font-display text-left text-base font-semibold text-warm-900 hover:text-gold">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-warm-500">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ivory-warm py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-warm-900">
              Still Have Questions?
            </h2>
            <div className="mx-auto mt-4 w-12 h-0.5 bg-gold" />
            <p className="mt-4 text-base text-warm-500">
              Our team is happy to help with any questions you might have about
              our properties or the rental process.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-gold text-white hover:bg-gold-dark"
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
