"use client";

import { Suspense } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ErrorDisplay } from "@/components/error-display";
import { useSearchParams } from "next/navigation";

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("code") || "500";
  const errorMessage = searchParams.get("message") || "Something went wrong";

  return <ErrorDisplay code={errorCode} message={errorMessage} />;
}

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <main className="py-20">
        <Suspense fallback={<ErrorDisplay code="500" message="Loading..." />}>
          <ErrorContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
