import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: '#0284c7',
};

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://gwdkerala.vercel.app'),
  title: 'GWD Dashboard | Ground Water Department, Kerala',
  description: 'The official GWD Dashboard for the Ground Water Department, Kerala (GWD Kerala). Manage deposit works, investigations, tenders, and more.',
  keywords: ['GWD Kerala', 'GWD Dashboard', 'Ground Water Department', 'GWD', 'Kerala', 'Water Management', 'Government Dashboard'],
  authors: [{ name: 'Ground Water Department, Govt. of Kerala' }],
  creator: 'Ground Water Department, Govt. of Kerala',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'GWD Dashboard | Ground Water Department, Kerala',
    description: 'Official portal for managing GWD Kerala activities.',
    url: 'https://gwdkerala.vercel.app',
    siteName: 'GWD Kerala Dashboard',
    images: [
      {
        url: 'https://i.postimg.cc/RVT0H2z7/gwd-og-image.png',
        width: 1200,
        height: 630,
        alt: 'GWD Kerala Dashboard',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GWD Dashboard',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/gwd-logo.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/icon-192.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/svg+xml" href="/gwd-logo.svg" />
        <meta name="theme-color" content="#0284c7" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GWD Dashboard" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
