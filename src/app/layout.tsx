import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MSN — Moroccan Social Network",
  description: "La plateforme exclusive des créateurs marocains",
  appleWebApp: { capable: true, title: "MSN", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Montserrat:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-full">
        {/* l'app est pensée mobile : colonne centrée de 480px max */}
        <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-ivoire">
          {/* les pages lisent la session : elles s'affichent dès qu'elle est prête */}
          <Suspense fallback={<Chargement />}>{children}</Suspense>
        </div>
      </body>
    </html>
  );
}

function Chargement() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <div className="font-titre text-4xl font-light tracking-[8px]">MSN</div>
      <div className="h-1.5 w-1.5 animate-ping rotate-45 bg-or" />
    </div>
  );
}
