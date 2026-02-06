import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Krakens Analytics - Real-Time Web Analytics',
  description: 'Privacy-focused real-time web analytics platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
