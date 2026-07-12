import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: {
    default: "ShiftFlow",
    template: "%s | ShiftFlow",
  },
  description:
    "Schichten, Arbeitszeiten und Einnahmen verwalten",
  applicationName: "ShiftFlow",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ShiftFlow",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-slate-950 text-white">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}