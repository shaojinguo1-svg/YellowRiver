"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { inquirySchema, type InquiryInput } from "@/validations/inquiry";

const CONTACT_DETAILS = [
  {
    icon: Phone,
    label: "Phone",
    value: "(626) 492-6480",
    href: "tel:+16264926480",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info@yellowriver.com",
    href: "mailto:info@yellowriver.com",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "301 E Colorado Blvd, Pasadena, CA 91101",
    href: null,
  },
  {
    icon: Clock,
    label: "Business Hours",
    value: "Mon-Fri: 9AM-6PM | Sat: 10AM-4PM",
    href: null,
  },
];

export default function ContactPage() {
  return (
    <Suspense>
      <ContactPageContent />
    </Suspense>
  );
}

function ContactPageContent() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: searchParams.get("subject") || "",
      message: "",
    },
  });

  async function onSubmit(data: InquiryInput) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to submit inquiry");
      }

      toast.success("Message sent successfully! We will get back to you soon.");
      reset();
    } catch {
      toast.error(
        "Something went wrong. Please try again or contact us directly."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-charcoal relative py-20 sm:py-28">
        <div className="bg-mesh-dark absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-medium mb-4">
            Get In Touch
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Contact Us
          </h1>
          <div className="mx-auto mt-4 w-16 h-0.5 bg-gold" />
          <p className="mt-6 text-lg text-warm-300 max-w-2xl mx-auto">
            Have a question about a property or need help with your rental
            search? We would love to hear from you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-16">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <h2 className="font-display text-2xl font-bold tracking-tight text-warm-900">
                Send Us a Message
              </h2>
              <p className="mt-2 text-sm text-warm-500">
                Fill out the form below and our team will respond within one
                business day.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-8 space-y-6"
              >
                {/* Name & Email row */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      aria-invalid={!!errors.name}
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      aria-invalid={!!errors.email}
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone & Subject row */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 000-0000"
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      Subject <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="subject"
                      placeholder="Property inquiry"
                      aria-invalid={!!errors.subject}
                      {...register("subject")}
                    />
                    {errors.subject && (
                      <p className="text-sm text-destructive">
                        {errors.subject.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help you..."
                    className="min-h-32"
                    aria-invalid={!!errors.message}
                    {...register("message")}
                  />
                  {errors.message && (
                    <p className="text-sm text-destructive">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-gold text-white hover:bg-gold-dark sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Info Sidebar */}
            <div className="lg:col-span-2">
              <Card className="border-warm-200">
                <CardHeader>
                  <CardTitle className="font-display">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {CONTACT_DETAILS.map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
                        <item.icon className="size-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-warm-900">
                          {item.label}
                        </p>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="text-sm text-warm-500 transition-colors hover:text-gold"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-sm text-warm-500">
                            {item.value}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Location Card */}
              <Card className="mt-6 border-warm-200 overflow-hidden">
                <div className="bg-charcoal px-6 py-4">
                  <div className="flex items-center gap-2 text-white">
                    <MapPin className="size-5 text-gold" />
                    <span className="font-display text-sm font-semibold">Our Office</span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-warm-900">
                    301 E Colorado Blvd
                  </p>
                  <p className="text-sm text-warm-500">Pasadena, CA 91101</p>
                  <div className="mt-4 flex gap-2">
                    <a
                      href="https://maps.google.com/?q=301+E+Colorado+Blvd+Pasadena+CA+91101"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold-dark transition-colors hover:bg-gold/20"
                    >
                      <MapPin className="size-3" />
                      Get Directions
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
