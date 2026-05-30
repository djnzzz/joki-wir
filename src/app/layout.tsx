import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "Jokiwir — Jasa Joki Game Action RPG",
    template: "%s | Jokiwir",
  },
  description:
    "Layanan jasa joki game Action RPG profesional sebagai solusi frustrasi gaming mu.",
  keywords: ["joki game", "dark souls", "elden ring", "black myth wukong"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
