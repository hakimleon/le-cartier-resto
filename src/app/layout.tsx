import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "La Compagnie - Gestion de Restaurant",
  description: "Application de gestion pour le restaurant La Compagnie.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={cn("font-sans", inter.variable)} suppressHydrationWarning={true}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
