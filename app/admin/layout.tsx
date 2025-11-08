import { Suspense } from "react";
import AdminLayout from "@/components/AdminLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AdminLayout>{children}</AdminLayout>
    </Suspense>
  );
}

