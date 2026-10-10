import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "RedTaxi Pollachi",
    template: "%s | RedTaxi",
  },
  description: "RedTaxi Pollachi — Book a cab, anytime.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
