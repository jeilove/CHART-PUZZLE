import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chart Puzzle - 개인화 서비스",
  description: "Stock Chart Puzzle with Personalized Favorites",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255,255,255,0.4)', padding: '4px 10px', textAlign: 'center', fontSize: '10px', fontWeight: '700', position: 'fixed', top: '15px', right: '15px', borderRadius: '4px', zIndex: 9999, pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
          v2.9.0
        </div>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
