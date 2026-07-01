import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Corvinth — Image Safety Infrastructure | NCII Detection & TIDA Compliance",
  description:
    "Image and video safety infrastructure for user-generated content platforms. Corvinth's two-pipeline detection — Shield (hash matching, under 100ms) and Pulse (semantic matching via DINOv2) — starts with NCII detection and TIDA compliance.",
  openGraph: {
    title: "Corvinth — Image Safety Infrastructure | NCII Detection & TIDA Compliance",
    description:
      "Image and video safety infrastructure for user-generated content platforms. Corvinth's two-pipeline detection — Shield (hash matching, under 100ms) and Pulse (semantic matching via DINOv2) — starts with NCII detection and TIDA compliance.",
    type: "website",
    url: "https://corvinth.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Corvinth — Image Safety Infrastructure | NCII Detection & TIDA Compliance",
    description:
      "Image and video safety infrastructure for user-generated content platforms. Corvinth's two-pipeline detection — Shield (hash matching, under 100ms) and Pulse (semantic matching via DINOv2) — starts with NCII detection and TIDA compliance.",
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