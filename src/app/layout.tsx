import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/store/CartContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "COMECSA | Somos parte de tu estilo",
  description:
    "Ropa, calzado, accesorios y artículos para el hogar en La Libertad, Santa Elena. Más de 30 años vistiendo a tu familia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={poppins.variable}>
      <body className="min-h-screen bg-[#f5f6fa] font-sans text-ink-900 antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
