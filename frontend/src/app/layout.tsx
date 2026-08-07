import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'ClauseGuard AI | Editorial Contract Risk Audit & Algorand x402',
  description: 'Instant AI contract clause risk analysis, explanations, and safe rewording protected by Algorand TestNet x402 protocol.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} ${playfair.variable} font-sans min-h-screen flex flex-col bg-[#F8F9FA] text-[#212529] antialiased selection:bg-[#C5A059] selection:text-[#0A192F]`}>
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
