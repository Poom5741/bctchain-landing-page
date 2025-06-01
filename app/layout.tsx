import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BCTChain - The Financial Layer for Synthetic Assets",
  description:
    "Bridge Bitcoin, mint transparent synthetic assets, and unlock global financial markets on BCTChain. Built for institutions, designed for everyone.",
  generator: "Next.js",
  keywords: [
    "BCTChain",
    "synthetic assets",
    "DeFi",
    "Bitcoin",
    "blockchain",
    "finance",
  ],
  authors: [{ name: "BCTChain Team" }],
  creator: "BCTChain",
  publisher: "BCTChain",
  metadataBase: new URL("https://bctchain.com"),
  openGraph: {
    title: "BCTChain - The Financial Layer for Synthetic Assets",
    description:
      "Bridge Bitcoin, mint transparent synthetic assets, and unlock global financial markets on BCTChain.",
    url: "https://bctchain.com",
    siteName: "BCTChain",
    images: [
      {
        url: "/images/bctchain-logo.png",
        width: 1200,
        height: 630,
        alt: "BCTChain Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BCTChain - The Financial Layer for Synthetic Assets",
    description:
      "Bridge Bitcoin, mint transparent synthetic assets, and unlock global financial markets on BCTChain.",
    images: ["/images/bctchain-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/bctchain-logo.png" />
        <link rel="apple-touch-icon" href="/images/bctchain-logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
