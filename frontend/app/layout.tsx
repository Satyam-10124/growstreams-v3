import type { Metadata } from "next"
import { Space_Grotesk, JetBrains_Mono } from "next/font/google"
import Script from "next/script"
import "./globals.css"


const spaceGrotesk = Space_Grotesk({
  display: "swap",
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  display: "swap",
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "GrowStreams — Vara-native Money Streaming Protocol",
  description:
    "GrowStreams is a generalized token streaming protocol on Vara. Per-second payments for bounties, payroll, subscriptions, revenue share, grants, and more.",
  openGraph: {
    title: "GrowStreams — Vara-native Money Streaming Protocol",
    description:
      "Per-second token streaming on Vara. Bounties, payroll, subscriptions, revenue share — all powered by real-time streams.",
    url: "https://growstreams.xyz",
    siteName: "GrowStreams",
    images: [
      { url: "/logo.png", width: 1200, height: 630, alt: "GrowStreams Protocol" },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GrowStreams — Vara-native Money Streaming Protocol",
    description:
      "Per-second token streaming on Vara. Bounties, payroll, subscriptions, revenue share — composable, token-agnostic, real-time.",
    images: ["/logo.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" type="image/png" href="/logo-mark.png" />
        <link rel="stylesheet" href="/css/6997d9d9ea53150e.css" />
        <link rel="stylesheet" href="/css/fbcbfeb8105deba8.css" />
        <link rel="stylesheet" href="/css/febab3fae21381e6.css" />
        <link rel="stylesheet" href="/css/163f657a16afbe5e.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="/css/google-fonts.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
        <link rel="stylesheet" href="/_astro/about.CnngLkgH.css" />
        <link rel="stylesheet" href="/_astro/index.D5hQtxWv.css" />
        <link rel="stylesheet" href="/_astro/index.T_1Ozbp6.css" />
        <link rel="stylesheet" href="/css/growstream-overrides.css" />
        <link rel="stylesheet" href="/css/gsap-streams.css" />
      </head>
      <Script
        src="https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js"
        strategy="afterInteractive"
      />
      <Script id="ethers-fallback" strategy="afterInteractive">{`
        window.addEventListener('load', function() {
          if (typeof window.ethers === 'undefined') {
            var s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js';
            s.onload = function() { window.dispatchEvent(new CustomEvent('ethersLoaded')); };
            document.head.appendChild(s);
          } else {
            window.dispatchEvent(new CustomEvent('ethersLoaded'));
          }
        });
      `}</Script>
      <body className="antialiased bg-white text-black" suppressHydrationWarning={true}>
        {children}
        <div hidden suppressHydrationWarning>
          <script src="/assets/js/prism.min.js"></script>
          <script src="/assets/js/prism-json.min.js"></script>
          <script src="/assets/js/prism-line-numbers.min.js"></script>
          <script src="/scripts/astro-inline-0.js"></script>
          <script src="/scripts/astro-inline-1.js"></script>
          <script type="module" src="/_astro/Layout.astro_astro_type_script_index_0_lang.C_gQ3aFc.js"></script>
          <script async src="/js/google-tag-lib.js"></script>
          <script src="/scripts/google-tag.js"></script>
          <script src="/scripts/meta-pixel.js"></script>
          <script src="/scripts/apollo-tracking.js"></script>
          <script src="/scripts/version-checker.js"></script>
          <script src="/scripts/module-error-handler.js"></script>
          <script src="/scripts/astro-inline-11.js"></script>
          <script src="/scripts/x-pixel.js"></script>
          <script src="/scripts/reddit-pixel.js"></script>
          <script src="/scripts/tiktok-pixel.js"></script>
          <script src="/scripts/astro-inline-15.js"></script>
          <script src="/scripts/astro-inline-16.js"></script>
          <script type="module" src="/scripts/astro-inline-17.js"></script>
          <script src="/scripts/astro-inline-18.js"></script>
          <script type="module" src="/_astro/SidecarHeroMockup.astro_astro_type_script_index_0_lang.BkmGY2bV.js"></script>
          <script type="module" src="/_astro/JourneyBegins.astro_astro_type_script_index_0_lang.WFxywcIV.js"></script>
          <script type="module" src="/_astro/JourneyBegins.astro_astro_type_script_index_1_lang.BFFTviqm.js"></script>
          <script src="/scripts/astro-inline-22.js"></script>
          <script defer src="/js/gsap-streams.js"></script>
        </div>
      </body>
    </html>
  )
}
