import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Demo Resto",
  description: "Plateforme de commande en ligne pour restaurateurs réunionnais",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
