import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import "@/app/(root)/globals.css";
import { GpxProvider } from "@/contexts/GpxContext";
import { Toaster } from "sonner";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Outdoor Connect - GPX Viewer & Editor",
  description: "Upload, visualize, edit, and merge GPX tracks for outdoor activities",
  authors: {
    name: "Nishanth Murugan",
    url: "https://outdoor.zealer.in",
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Outdoor Connect - GPX Viewer & Editor",
    description: "Upload, visualize, edit, and merge GPX tracks for outdoor activities",
    url: "https://outdoor.zealer.in",
    siteName: "Outdoor Connect",
  },
  twitter: {
    card: "summary_large_image",
    title: "Outdoor Connect - GPX Viewer & Editor",
    description: "Upload, visualize, edit, and merge GPX tracks for outdoor activities",
    creator: "@mnishanth02",
  },
  metadataBase: new URL("https://outdoor.zealer.in"),

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://outdoor.zealer.in",
  },
  category: "technology",

};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={ cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        ) }
      >
        <GpxProvider>
          { children }
          <Toaster position="top-right" />
        </GpxProvider>
      </body>
    </html>
  );
}
