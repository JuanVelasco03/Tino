import type { Metadata } from "next";
import { Familjen_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Interfaz.
const interfaz = Familjen_Grotesk({
  variable: "--font-interfaz",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// TODO importe monetario, sin excepción.
const cifras = IBM_Plex_Mono({
  variable: "--font-cifras",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Tino",
  description: "Finanzas personales: un libro de cuentas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`${interfaz.variable} ${cifras.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
