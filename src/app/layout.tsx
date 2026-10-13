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
  other: {
    'mobile-web-app-capable': 'yes',
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  const originalError = console.error;
                  console.error = function(...args) {
                    var fullText = '';
                    try {
                      fullText = args.map(function(a) {
                        return (a && (a.message || a.stack || (typeof a === 'string' ? a : ''))) || '';
                      }).join(' ');
                    } catch(e) {}
                    if (
                      fullText.indexOf('Failed to fetch RSC payload') !== -1 ||
                      fullText.indexOf('Falling back to browser navigation') !== -1 ||
                      fullText.indexOf('ChunkLoadError') !== -1 ||
                      fullText.indexOf('Loading chunk') !== -1 ||
                      fullText.indexOf('hydration') !== -1 ||
                      fullText.indexOf('Hydration') !== -1
                    ) {
                      return;
                    }
                    originalError.apply(console, args);
                  };

                  window.addEventListener('error', function(event) {
                    var msg = (event && (event.message || (event.error && (event.error.message || event.error.stack)))) || '';
                    if (typeof msg === 'string' && (
                      msg.indexOf('ChunkLoadError') !== -1 ||
                      msg.indexOf('Loading chunk') !== -1 ||
                      msg.indexOf('failed to load chunk') !== -1 ||
                      msg.indexOf('Failed to fetch RSC payload') !== -1 ||
                      msg.indexOf('hydration') !== -1 ||
                      msg.indexOf('Hydration') !== -1
                    )) {
                      event.preventDefault();
                      event.stopPropagation();
                      return true;
                    }
                  }, true);

                  window.addEventListener('unhandledrejection', function(event) {
                    var reason = event && event.reason;
                    var msg = (reason && (reason.message || reason.stack || reason.toString())) || '';
                    if (typeof msg === 'string' && (
                      msg.indexOf('ChunkLoadError') !== -1 ||
                      msg.indexOf('Loading chunk') !== -1 ||
                      msg.indexOf('failed to load chunk') !== -1 ||
                      msg.indexOf('Failed to fetch RSC payload') !== -1 ||
                      msg.indexOf('hydration') !== -1 ||
                      msg.indexOf('Hydration') !== -1
                    )) {
                      event.preventDefault();
                      event.stopPropagation();
                      return true;
                    }
                  }, true);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
