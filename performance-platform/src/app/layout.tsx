import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import Navigation from "@/components/layout/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Performance Platform",
  description: "A futuristic performance management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen`}>
        <LayoutWrapper>
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </LayoutWrapper>
      </body>
    </html>
  );
}
