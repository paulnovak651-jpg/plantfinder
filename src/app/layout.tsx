import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'PlantFinder — Find Edible Plants, Rootstocks & Scionwood',
  description: 'Search across independent nurseries for edible plants, rootstocks, and scionwood. See availability, shipping windows, and who can ship to you.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-stone-950 text-stone-100`}>
        {children}
      </body>
    </html>
  );
}
