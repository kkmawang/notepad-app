import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notepad | Premium Workspace",
  description: "A beautiful, premium notepad application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${inter.variable} font-sans antialiased text-[#333333] bg-[#f8f9fa] min-h-screen selection:bg-[#00c73c]/30 selection:text-[#008f2a]`}
      >
        {children}
      </body>
    </html>
  );
}
