import type { Metadata } from 'next';
import {
  Bebas_Neue, IBM_Plex_Mono, Lora,
  Playfair_Display, DM_Sans, DM_Mono, Source_Serif_4,
} from 'next/font/google';
import './globals.css';

// Admin fonts
const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas-neue' });
const ibmPlexMono = IBM_Plex_Mono({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--font-ibm-plex-mono' });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' });

// Public fonts
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-dm-mono', display: 'swap' });
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'SIGNAL — The Authority Engine',
    template: '%s | SIGNAL',
  },
  description: 'SIGNAL covers the operators building the next generation of healthcare, energy, and construction companies.',
  openGraph: { siteName: 'SIGNAL', type: 'website' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={[
        bebasNeue.variable,
        ibmPlexMono.variable,
        lora.variable,
        playfair.variable,
        dmSans.variable,
        dmMono.variable,
        sourceSerif.variable,
      ].join(' ')}
    >
      <body>{children}</body>
    </html>
  );
}
