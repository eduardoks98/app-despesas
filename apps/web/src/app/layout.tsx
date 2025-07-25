import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'App Despesas - Controle Financeiro Inteligente',
  description: 'Gerencie suas finanças de forma simples e eficiente com o App Despesas Premium',
  keywords: 'finanças, controle financeiro, despesas, receitas, orçamento, gestão financeira',
  authors: [{ name: 'App Despesas Team' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://app.despesas.com',
    siteName: 'App Despesas',
    title: 'App Despesas - Controle Financeiro Inteligente',
    description: 'Gerencie suas finanças de forma simples e eficiente',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'App Despesas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'App Despesas - Controle Financeiro Inteligente',
    description: 'Gerencie suas finanças de forma simples e eficiente',
    images: ['/twitter-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
      { url: '/apple-icon-180x180.png', sizes: '180x180' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#8b5cf6" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}