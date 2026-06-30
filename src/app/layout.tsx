import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Conferência 2026 — Até o Fim | Ministério Recarga',
  description:
    'Reserve sua camisa da Conferência 2026 "ATÉ O FIM" dos adolescentes do Ministério Recarga.',
  openGraph: {
    title: 'Conferência 2026 — Até o Fim',
    description: 'Reserve sua camisa | Ministério Recarga',
    images: ['/logo.png']
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="grain min-h-screen">{children}</body>
    </html>
  );
}
