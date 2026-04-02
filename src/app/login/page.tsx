import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import Link from "next/link";

export const metadata = {
  title: "Login | PocketGram",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-white px-4 py-16 text-gray-900">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-xl font-semibold tracking-tight">
          PocketGram
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">Sign in</p>
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/" className="text-gray-900 underline underline-offset-2">
            Back to notes
          </Link>
        </p>
      </div>
    </div>
  );
}
