/*
 * ---------------------------------------------------------
 * K A P I T T O | Snippet Manager
 * ---------------------------------------------------------
 * Maintainer: Erdem Avni Selçuk (eravse)
 * Website:    eravse.com
 * License:    Private / (c) 2026
 * ---------------------------------------------------------
 */

import type { Metadata } from "next";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import {Toaster} from "sonner";

export const metadata: Metadata = {
  title: "Snippet Manager",
  description: "Modern Code Snippet Manager with SQLite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
