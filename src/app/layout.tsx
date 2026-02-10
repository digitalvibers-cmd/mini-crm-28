import type { Metadata } from "next";
import { Prata } from "next/font/google";
import { ClientLayout } from "@/components/layout/ClientLayout";
import "./globals.css";

const prata = Prata({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-prata",
});

export const metadata: Metadata = {
  title: "Mini CRM Dashboard",
  description: "Dashboard for 28ishrana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${prata.variable} font-sans bg-[var(--bg-main)] text-[var(--text-primary)] antialiased`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
