import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image AI — Prompt discovery",
  description: "Discover and use prompt templates for image generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
