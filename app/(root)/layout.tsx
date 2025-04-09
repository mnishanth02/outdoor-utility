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
