import type { Metadata } from "next";
import { Jost, JetBrains_Mono, DM_Mono, Space_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

/* Stack tipográfico canon Tlacuilo v2 (Sonoran fuera).
   Cada fuente expone --font-X que globals.css mapea a font-sans/mono/micro. */
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/* Space Mono · detalles/micro-labels (landing v3, 2026-07-08) */
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

/* Fuentes del booklet / manifesto (display, comerciales, local OTF).
   Solo se usan en /manifesto; el resto de la app sigue con Jost / JetBrains / DM Mono. */
const acacia = localFont({
  src: "../public/fonts/Acacia.otf",
  variable: "--font-acacia-otf",
  display: "swap",
});

const costa = localFont({
  src: "../public/fonts/Costa.otf",
  variable: "--font-costa-otf",
  display: "swap",
});

const oaxacaPrickly = localFont({
  src: "../public/fonts/OaxacaPrickly.otf",
  variable: "--font-oaxaca-prickly",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tlacuilo · activación de bibliotecas",
  description:
    "Sistema de préstamo de objetos físicos. Libros, vinilos, arte. CDMX, los comunes.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tlacuilo",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#15151D",
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
    <html
      lang="es"
      className={`${jost.variable} ${jetbrainsMono.variable} ${dmMono.variable} ${spaceMono.variable} ${acacia.variable} ${costa.variable} ${oaxacaPrickly.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
