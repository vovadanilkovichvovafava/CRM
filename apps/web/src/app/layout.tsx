import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Janus CRM - See everything. Miss nothing.',
  description: 'Janus CRM — полная картина клиента. Платформа нового поколения для affiliate marketing. Видим прошлое, строим будущее.',
  keywords: ['CRM', 'affiliate marketing', 'partner management', 'sales pipeline', 'Janus'],
  openGraph: {
    title: 'Janus CRM',
    description: 'See everything. Miss nothing.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            richColors
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'hsl(240 10% 3.9%)',
                border: '1px solid hsl(240 3.7% 15.9%)',
                color: 'hsl(0 0% 98%)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
