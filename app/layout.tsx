import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Corvinth — Stop NCII Before It Reaches Your Users",
  description:
    "One API call. Scan every upload in under 200ms. Block known NCII re-uploads before they spread. TIDA compliant. Built for dating apps, social platforms, and creator tools.",
  openGraph: {
    title: "Corvinth — Stop NCII Before It Reaches Your Users",
    description:
      "One API call. Scan every upload in under 200ms. Block known NCII before it spreads.",
    type: "website",
    url: "https://corvinth.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Corvinth — Stop NCII Before It Reaches Your Users",
    description:
      "One API call. Scan every upload in under 200ms. Block known NCII before it spreads.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Single consolidated font import — Inter + JetBrains Mono + Syne */}
        {/* Inter: body/UI, JetBrains Mono: code/mono, Syne: display headings */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}