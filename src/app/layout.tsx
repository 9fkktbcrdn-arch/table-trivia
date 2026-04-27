import type { Metadata, Viewport } from "next";
import "./globals.css";
import type { ReactNode } from "react";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Table Trivia",
  description: "Dinner-table trivia for iPhone and iPad — pick a topic and play.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Table Trivia" },
};

export const viewport: Viewport = {
  themeColor: "#1A1915",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body
        className="min-h-dvh bg-tt-bg font-body text-base leading-relaxed text-parchment antialiased"
      >
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
