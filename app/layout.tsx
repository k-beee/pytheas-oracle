import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pytheas Oracle — Autonomous Live-Web Navigator & Settlement Matrix",
  description:
    "Decentralized live-web verified prediction oracle and parimutuel settlement clearinghouse powered by GenLayer Intelligent Contracts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen selection:bg-polar-500 selection:text-midnight-950">
        {children}
      </body>
    </html>
  );
}
