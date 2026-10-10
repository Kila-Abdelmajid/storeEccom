import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Header from "@/components/client/Header/Header";
import Footer from "@/components/client/Footer/Footer";
import { ToastProvider } from '@/contexts/ToastContext';
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import FloatingMenu from "@/components/client/FloatingMenu";



export const metadata: Metadata = {
  
  title: "Fleur Marwa",
  description: "Shop the best products with style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"
    >
      <body >
        <AuthProvider>
         <ToastProvider>
        <FavoritesProvider >

      <Header />
      <main className="pt-20" >{children}
        <FloatingMenu />
      </main>
      <Footer />
      </FavoritesProvider>
    </ToastProvider>
    </AuthProvider>
      </body>
    </html>
  );
}