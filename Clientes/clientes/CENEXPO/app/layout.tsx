import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cenexpo | Centro de Exposiciones y Eventos",
  description: "Centro de exposiciones y eventos. Coliseos, salones y pabellones para ferias, convenciones y eventos corporativos en la Armenia, Quindío.",
  keywords: "centro de exposiciones, eventos, convenciones, coliseos, salones, pabellones, ferias",
  openGraph: {
    title: "Cenexpo | Centro de Exposiciones y Eventos",
    description: "Espacios modernos para tus eventos y convenciones. Infraestructura de clase mundial en la Armenia, Quindío.",
    type: "website",
    locale: "es_CO",
    url: "https://cenexpo.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${barlow.variable} ${inter.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://cenexpo.com" />
      </head>
      <body className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white font-body">
        <Header />
        <main>
          {children}
        </main>
        <Footer />

        {/* Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Cenexpo",
              description: "Centro de exposiciones y eventos en la Armenia, Quindío",
              url: "https://cenexpo.com",
              sameAs: ["https://facebook.com/cenexpo", "https://instagram.com/cenexpo"],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Customer Service",
                availableLanguage: "es",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EventVenue",
              name: "Cenexpo",
              description: "Centro de exposiciones con coliseos, salones y pabellones para eventos",
              url: "https://cenexpo.com",
              amenityFeature: [
                { "@type": "Text", name: "Coliseos" },
                { "@type": "Text", name: "Salones multiuso" },
                { "@type": "Text", name: "Pabellones" },
                { "@type": "Text", name: "Servicios de catering" },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
