import './globals.css';

import { Besley, Inter } from 'next/font/google';
import { ThemeProvider } from '@/app/components/theme/theme-provider';

const besley = Besley({
  subsets: ['latin'],
  variable: '--font-besley',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Thinkscape',
  description: 'Voice based ideation tool',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${besley.variable} font-sans min-h-screen antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
