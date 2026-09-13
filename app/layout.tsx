import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Corvinth — Image Safety Infrastructure",
  description:
    "Image safety infrastructure for platforms with user-generated content. Corvinth helps your team find copies of content it has chosen to track across existing platform content and new uploads.",
  openGraph: {
    title: "Corvinth — Image Safety Infrastructure",
    description:
      "Reported content comes back. Corvinth helps you find the copies. Image safety infrastructure for platforms with user-generated content.",
    type: "website",
    url: "https://corvinth.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Corvinth — Image Safety Infrastructure",
    description:
      "Reported content comes back. Corvinth helps you find the copies. Image safety infrastructure for platforms with user-generated content.",
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
