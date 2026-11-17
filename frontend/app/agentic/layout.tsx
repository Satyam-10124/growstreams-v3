import SiteScripts from "./components/SiteScripts";
import React from "react";
import { ReactLenis } from 'lenis/react'

export default function AgenticLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel={"dns-prefetch"} href={"https://use.typekit.net"} />
      <link rel={"preconnect"} href={"https://use.typekit.net"} crossOrigin={""} />
      <link rel={"dns-prefetch"} href={"https://snippet.plinth.digital"} />
      <link rel={"preconnect"} href={"https://snippet.plinth.digital"} crossOrigin={""} />
      <link rel={"dns-prefetch"} href={"https://kits.plinth.digital"} />
      <link rel={"preconnect"} href={"https://kits.plinth.digital"} crossOrigin={""} />

      <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
        <div className={"homepage"} data-scroll-container={""}>
          {children}
          <SiteScripts />
        </div>
      </ReactLenis>
    </>
  );
}
