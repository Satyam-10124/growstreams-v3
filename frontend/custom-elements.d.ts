import type * as React from "react";

// Astro islands render as plain custom elements inside the cloned markup;
// teach TypeScript about them so <astro-island> & co type-check.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "astro-island": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "astro-slot": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
