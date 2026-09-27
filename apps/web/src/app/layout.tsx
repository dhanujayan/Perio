import type { Metadata } from 'next';
import './globals.css';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { getSessionUser } from '@/lib/api';
import { site } from '@/site.config';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: gum health answers`, template: `%s | ${site.name}` },
  description: site.tagline,
  openGraph: { siteName: site.name, type: 'website', locale: 'en_IN' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="en-IN">
      <body>
        <Header user={user} />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
