export interface NavItem {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Stonk on Vara & AI Squads", href: "/agents" },
  { label: "Protocol Overview & DeFiLlama", href: "/protocol-overview" },
  { label: "Streams", href: "/app/streams" },
  { label: "TokenVault", href: "/app/vault" },
  { label: "Bounties", href: "/app/bounties" },
  { label: "Developers", href: "/developers" },
  { label: "Docs", href: "https://docs.vara.network/" },
];

export const HEADER_CTA = {
  label: "Launch App",
  href: "/app",
};
