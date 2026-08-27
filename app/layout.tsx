import type { Metadata } from "next";
import { DM_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Corvinth — Image safety infrastructure for upload platforms",
  description:
    "Corvinth compares privacy-preserving image fingerprints with reported-image records and returns a structured signal. Your platform stays in control.",
  openGraph: {
    title: "Corvinth — Image safety infrastructure for upload platforms",
    description:
      "Corvinth compares privacy-preserving image fingerprints with reported-image records and returns a structured signal. Your platform stays in control.",
    type: "website",
    url: "https://corvinth.com",
    images: [
      {
        url: "https://corvinth.com/og.png",
        width: 1200,
        height: 630,
        alt: "Corvinth — Catch known harmful images before they spread.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Corvinth — Image safety infrastructure for upload platforms",
    description:
      "Corvinth compares privacy-preserving image fingerprints with reported-image records and returns a structured signal. Your platform stays in control.",
    images: ["https://corvinth.com/og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
