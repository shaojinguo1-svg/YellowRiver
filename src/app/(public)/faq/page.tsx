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
      "Absolutely. We encourage prospective tenants to tour properties before applying. You can schedule a tour directly from any listing page by selecting your preferred date and time, or by contacting our office at (555) 123-4567. We offer tours Monday through Saturday and can accommodate evening appointments upon request.",
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
      "Current tenants can submit maintenance requests through their online tenant portal 24/7. For urgent issues such as water leaks, heating failures, or security concerns, please call our emergency maintenance line at (555) 123-4568. Non-emergency requests are typically addressed within 1-3 business days. We take pride in maintaining our properties to the highest standard.",
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
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Frequently Asked{" "}
            <span className="text-amber-500">Questions</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
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
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Still Have Questions?
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Our team is happy to help with any questions you might have about
              our properties or the rental process.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-amber-500 text-white hover:bg-amber-600"
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
