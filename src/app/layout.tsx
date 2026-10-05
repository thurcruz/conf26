import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BRAND, EVENT, LINK_COVER, LOGOS } from '@/lib/products';

/** URL publica do site — OG/Twitter exigem URL absoluta na previa. */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

export const metadata: Metadata = {
  title: `${EVENT.name} — ${EVENT.tagline} ${EVENT.year} | ${EVENT.ministry}`,
  description: `Reserve sua camisa da ${EVENT.name}, a conferência de jovens do ${EVENT.ministry}. ${EVENT.dateLabel}.`,
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: EVENT.name,
    title: `${EVENT.name} — ${EVENT.tagline} ${EVENT.year}`,
    description: `Reserve sua camisa | ${EVENT.ministry}`,
    images: [{ ...LINK_COVER, alt: `Reserve sua camisa — ${EVENT.name}` }]
  },
  twitter: {
    card: 'summary_large_image',
    title: `${EVENT.name} — ${EVENT.tagline} ${EVENT.year}`,
    description: `Reserve sua camisa | ${EVENT.ministry}`,
    images: [LINK_COVER.url]
  },
  icons: {
    icon: LOGOS.favicon,
    shortcut: LOGOS.favicon,
    apple: LOGOS.favicon
  }
};

export const viewport: Viewport = {
  themeColor: BRAND.navy
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-paper">{children}</body>
    </html>
  );
}
