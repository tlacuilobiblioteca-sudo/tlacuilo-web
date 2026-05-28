import type { Metadata } from "next";
import { Jost, JetBrains_Mono, DM_Mono } from "next/font/google";
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
  weight: ["400", "500"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
      className={`${jost.variable} ${jetbrainsMono.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
