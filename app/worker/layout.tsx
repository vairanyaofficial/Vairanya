import { Suspense } from "react";
import WorkerLayout from "@/components/WorkerLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <WorkerLayout>{children}</WorkerLayout>
    </Suspense>
  );
}

