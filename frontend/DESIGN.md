# GrowStreams Design System

Derived from the marketing homepage (`growstream-ui` → now `frontend/app/page.tsx`). This document defines the visual language used across the site **and** the `/app` dashboard. Reference implementations: `components/Hero.tsx`, `GSAP/*`, `components/gsui/*`.

---

## 1. Brand Idea

A "financial instrument panel" aesthetic: paper-white surfaces, sage-green panels, ruler tick marks, cut corners, and arrow pointers — precision engineering applied to money streams.

## 2. Color Palette

Tokens live in the global stylesheet (`public/css/6997d9d9ea53150e.css`) and are usable as Tailwind-style class names anywhere (`bg-sage-1`, `text-moss`, …).

| Token        | Hex       | Role                                                        |
| ------------ | --------- | ----------------------------------------------------------- |
| `white`      | `#ffffff` | Page background, card surface                               |
| `sage-1`     | `#f4faed` | Hero/feature panels, soft section fills                     |
| `sage-2`     | `#f0fae6` | Active nav state, hover fill                                |
| `sage-3`     | `#d8e5ca` | Borders on filled panels, dividers                          |
| `sage-4`     | `#b3c5a0` | Muted decorative strokes                                    |
| `sage-5`     | `#4a5b38` | Dark muted text / rulers on dark                            |
| `forest`     | `#18280e` | Primary ink-on-action: buttons, dark CTA sections, footer   |
| `moss`       | `#3f7308` | Links, positive states, hover accent                        |
| `lemongrass` | `#b2eb76` | Accent text/icons on forest; secondary button fill          |
| `clay`       | `#c9753d` | Warning / pending states                                    |
| `black`      | `#090f05` | Body ink                                                    |

Semantic mapping in the app:

| Meaning         | Token                        |
| --------------- | ---------------------------- |
| Active/success  | `moss`                       |
| Pending/warning | `clay`                       |
| Danger/error    | red-500 `#fb2c36`            |
| Info/neutral    | `black` at 60–80% or `sage-5`|
| Highlight       | `lemongrass` on `forest`     |

## 3. Typography

Loaded via preloaded woff2 + CSS chunks (classes available globally):

| Class                    | Font                 | Usage                                  |
| ------------------------ | -------------------- | -------------------------------------- |
| `text-84px-heading`      | naNSuperX (variable) | Hero headline                          |
| `text-78px-footer-cta`   | naNSuperX            | Footer CTA                             |
| `text-40px-heading-thin` | naNSuperX, wt 520    | Section/page titles                    |
| `text-20px-stat`         | naNSuperX, wt 520    | Stat callouts                          |
| `text-15px-btn`          | FTPolarMono          | Buttons, nav links                     |
| `text-14px-eyebrow`      | FTPolarMono          | Eyebrows, labels                       |
| `text-13px-eyebrow-caps` | FTPolarMono, caps    | Small caps eyebrows                    |
| `text-11px-stat-description` | FTPolarMono      | Micro-labels under stats               |
| `text-10px-nav-heading`  | FTPolarMono, caps    | Column headings, table heads           |
| `text-14px-body`         | FTPolar              | Body copy                              |
| `text-12px-legal-link`   | FTPolar              | Legal/fine print                       |

Helper utilities defined in `globals.css`: `.gs-display` (naNSuperX), `.gs-mono` (FTPolarMono).

Rules:
- Headings always naNSuperX with slight negative tracking.
- Numbers/data/addresses always mono (`gs-mono`, `tabular-nums`).
- Body copy FTPolar, generous line height, opacity ≤ 0.8 for secondary.

## 4. Surfaces & Shapes

- **Cut corners**: signature shape. Panels clip 1–17px corners via `clip-path: polygon(...)`. Utility classes `.gs-cut`, `.gs-cut-sm`, `.gs-card` (see globals.css). Corner size scales mobile→desktop via `--corner-size-mobile/desktop` custom properties.
- **Cards** (`.gs-card`): white, 1px `rgba(9,15,5,.14)` line border, cut corners, hover lift `translateY(-2px)` + shadow. Variant `.gs-card--sage` = sage-1 panel.
- **Ruler ticks**: vertical/horizontal hairline tick strips on section edges (see `Hero`'s `RulerSide`).
- **Arrow pointers**: small triangle SVGs pointing inward at section edges.
- **Buttons**:
  - Primary (`.gs-btn-primary`): `bg-forest text-lemongrass rounded-md`, hover scale .98 + bg 90%.
  - Secondary (`.gs-btn-secondary`): white bg, `border-black/15`, hover `bg-lemongrass border-lemongrass`.
  - On dark: transparent bg, `border-white/15 text-white`, hover invert to white.
- **Inputs** (`.gs-input`): 1px line border, white bg, focus ring moss, mono for addresses/numbers.
- **Chips** (`.gs-chip`, `--moss/--clay/--red/--ink/--sage`): mono micro-caps status pills.

## 5. Motion (GSAP)

All motion respects `prefers-reduced-motion` (via `gsap.matchMedia`).

| Pattern                | Implementation                                | Used by                     |
| ---------------------- | --------------------------------------------- | --------------------------- |
| Scroll reveal          | `<Reveal>` — y+opacity+blur in, once, stagger support | every `/app` page   |
| Pinned scrub story     | `HeroDataField`, `EnrichmentGrid` timelines   | homepage                    |
| Float/bob loop         | sine yoyo tweens (hero mark, footer marks)    | homepage, empty states      |
| Count-up numbers       | `<CountUp>` quickTo-style tween with snap     | stat cards                  |
| Word-stagger headline  | word spans yPercent 110 → 0                   | homepage                    |

Kit components in `components/gsui/`: `Reveal`, `RevealGroup`, `CountUp`, `PageHeader`, `Skeleton*`.

## 6. Loading States

Skeletons over spinners. `.gs-skeleton` = sage gradient shimmer sweep (1.4s ease-in-out infinite). Compose: `StatCardSkeleton`, `RowsSkeleton(n)`, `PanelSkeleton`. Every async page renders skeletons shaped like its real layout.

## 7. Layout

- Marketing container: `max-w-[66.75rem]` centered.
- App shell: fixed sidebar (16rem) + sticky header (3.5rem) + scrollable main, content max-w 64–72rem.
- Spacing rhythm: sections `space-y-6`; inside cards `p-4/p-5`; grids `gap-3/gap-4`.
- Radii: mostly square/cut-corner; only pills and icon tiles use rounding.
