import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MovieZone — Stream together, for free.",
    template: "%s · MovieZone",
  },
  description:
    "A private, free-to-use movie streaming site for friends. Stream together, chat, and watch in sync.",
  applicationName: "MovieZone",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    title: "MovieZone",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-black text-white antialiased">{children}</body>
    </html>
  );
}
