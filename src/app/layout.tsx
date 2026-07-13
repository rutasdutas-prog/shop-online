import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TokoKita — Platform SaaS Toko Online untuk UMKM Indonesia",
  description: "Buat toko online profesional dalam hitungan menit. Kelola produk, inventaris, pesanan, dan pembayaran dengan mudah.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[--font-inter]">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
