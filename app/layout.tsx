import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { MainNav } from "@/components/main-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dr. Fei Note - Meeting Management System",
  description: "Intelligent meeting notes and management platform for Dr. Fei",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ToastProvider>
              <div className="min-h-screen bg-background">
                {/* Header with Navigation - kept across all pages */}
                <header className="border-b">
                  <div className="container mx-auto px-4 py-4">
                    <MainNav />
                  </div>
                </header>
                
                {/* Main content area */}
                <main className="flex-1">
                  {children}
                </main>
              </div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
