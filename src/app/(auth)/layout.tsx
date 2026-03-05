import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory bg-mesh-light px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-1">
            <span className="font-display text-3xl tracking-tight text-warm-900">
              Yellow
            </span>
            <span className="font-display text-3xl tracking-tight text-gold">
              River
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
