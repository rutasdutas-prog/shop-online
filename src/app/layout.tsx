import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TokoKita — Platform SaaS Toko Online untuk UMKM Indonesia",
  description: "Buat toko online profesional dalam hitungan menit. Kelola produk, inventaris, pesanan, dan pembayaran dengan mudah.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[--font-inter]">{children}</body>
    </html>
  );
}
