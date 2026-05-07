import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Header from "@/components/client/Header/Header";
import Footer from "@/components/client/Footer/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Your Store | Modern E‑commerce",
  description: "Shop the best products with style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body >
        <Header />
        <main className="pt-28 md:pt-32">{children}</main>
        <Footer />
      </body>
    </html>
  );
}