import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Rewind Café — Point of Sale & Management",
  description: "Web-based, offline-first POS and café management system for Rewind Café",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#E07A3F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..900&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased selection:bg-vintage-orange selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
