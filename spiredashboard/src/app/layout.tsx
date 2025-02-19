import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/context/AuthContext";
import AuthGuard from "@/components/AuthGuard";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Spire Coaching Dashboard",
  description: "Elite Performance Coaching Platform",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.variable} font-sans antialiased bg-[#1C1C1E] text-white min-h-screen`}>
        <AuthProvider>
          <AuthGuard>
            <div className="flex min-h-screen bg-gradient-to-br from-[#000000] via-[#1C1C1E] to-[#1C1C1E]">
              <Sidebar />
              <main className="flex-1 px-6 py-4 overflow-auto">
                {children}
              </main>
            </div>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
