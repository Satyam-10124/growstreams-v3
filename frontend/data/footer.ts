export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Protocol",
    links: [
      { label: "Stonk on Vara 24/7 Desk", href: "/agents" },
      { label: "Protocol Overview & DeFiLlama", href: "/protocol-overview" },
      { label: "Token Streaming", href: "/app/streams" },
      { label: "TokenVault & gVARA", href: "/app/vault" },
      { label: "SplitsRouter (60/15/15/10)", href: "/app/splits" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "https://docs.vara.network/" },
      { label: "16 Sails Smart Contracts", href: "/agents" },
      { label: "GitHub (GrowStreams V3)", href: "https://github.com/Satyam-10124/growstreams-v3" },
      { label: "SDKs & APIs", href: "/developers" },
    ],
  },
  {
    title: "Ecosystem",
    links: [
      { label: "Vara Network", href: "https://vara.network/" },
      { label: "Developer Bounties", href: "/app/bounties" },
      { label: "AI-Scored Campaigns", href: "/app/campaign" },
      { label: "Permission Manager", href: "/app/permissions" },
    ],
  },
];

export const LEGAL_LINKS: FooterLink[] = [
  { label: "Terms of Service", href: "/terms.html" },
  { label: "Privacy Policy", href: "/privacy.html" },
  { label: "MSA", href: "/msa.html" },
  { label: "SLA", href: "/sla.html" },
];

export const FOOTER_INFO = {
  brandName: "GrowStreams",
  tagline: "Live programmable money streaming, AI agent squads & Stonk on Vara 24/7 Desk on Vara Network.",
  newsletterTitle: "Sign up to our newsletter",
  copyright: "© 2026 GrowStreams Protocol. All rights reserved.",
};
