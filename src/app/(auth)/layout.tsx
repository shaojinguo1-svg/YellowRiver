import Link from "next/link";
import { Building2 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="size-8 text-amber-500" />
            <span className="text-2xl font-bold tracking-tight">
              Yellow<span className="text-amber-500">River</span>
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
