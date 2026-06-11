import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Corvinth — Shield & Pulse | NCII Detection Infrastructure",
  description:
    "Two-pipeline NCII detection. Shield matches known hashes in under 100ms. Pulse catches semantic variants, crops, and direct complaints using DINOv2. TIDA compliant.",
  openGraph: {
    title: "Corvinth — Shield & Pulse | NCII Detection Infrastructure",
    description:
      "Two-pipeline NCII detection. Shield matches known hashes in under 100ms. Pulse catches semantic variants, crops, and direct complaints using DINOv2. TIDA compliant.",
    type: "website",
    url: "https://corvinth.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Corvinth — Shield & Pulse | NCII Detection Infrastructure",
    description:
      "Two-pipeline NCII detection. Shield matches known hashes in under 100ms. Pulse catches semantic variants, crops, and direct complaints using DINOv2. TIDA compliant.",
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
        {/* Single consolidated font import — Inter + JetBrains Mono */}
        {/* Inter: body/UI, JetBrains Mono: code/mono */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}