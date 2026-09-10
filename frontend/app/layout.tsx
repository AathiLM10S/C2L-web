import "./globals.css";
import React from "react";
import type { Metadata } from "next";
import { ClientLayout } from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "C2L QC Operations Management",
  description: "Enterprise C2L Work, Audit, QC & Client Reporting Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] text-slate-900 min-h-screen font-sans antialiased selection:bg-blue-600 selection:text-white">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
