import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Corvinth — Trust & Safety Infrastructure",
  description:
    "Corvinth helps dating apps, communities, and creator platforms detect and block non-consensual intimate image re-uploads before they reach users.",
  openGraph: {
    title: "Corvinth — Trust & Safety Infrastructure",
    description:
      "One API call. Scan every upload. Block known NCII before it spreads.",
    type: "website",
    url: "https://corvinth.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Corvinth — Trust & Safety Infrastructure",
    description:
      "One API call. Scan every upload. Block known NCII before it spreads.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}