# Premium Design System — Elegant, Apple × Instagram Vibe

A design language built on restraint, whitespace, and precision. The feeling: expensive, calm, effortless — nothing shouts, everything is considered.

---

## 1. Core Philosophy

- **Less, but better.** Every element earns its place. If removing it doesn't hurt the design, remove it.
- **Whitespace is a material**, not empty space. Generous margins signal confidence.
- **Content is the hero.** Chrome (nav bars, buttons, borders) recedes; photos, video, and typography lead.
- **Motion is quiet.** Transitions are smooth and physical, never bouncy or attention-seeking.
- **Consistency over novelty.** Premium feels familiar, not surprising — polish comes from repetition done perfectly.

---

## 2. Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#FFFFFF` | Main background |
| `--bg-elevated` | `#F5F5F7` | Cards, elevated surfaces (Apple's signature light grey) |
| `--bg-dark` | `#000000` | Dark mode base / hero sections |
| `--bg-dark-elevated` | `#1D1D1F` | Dark mode cards |
| `--text-primary` | `#1D1D1F` | Primary text (near-black, not pure black) |
| `--text-secondary` | `#6E6E73` | Secondary/muted text |
| `--text-inverse` | `#F5F5F7` | Text on dark backgrounds |
| `--divider` | `#D2D2D7` | Hairline borders, dividers |
| `--accent` | `#0071E3` | Single primary accent (Apple blue) — CTAs, links only |
| `--accent-muted` | `#0071E31A` | Accent at 10% opacity — subtle highlights, focus states |

**Rules:**
- One accent color, used sparingly — never more than one saturated color per screen.
- No pure black (`#000`) for text — always a near-black like `#1D1D1F` for warmth.
- Dark mode isn't inverted colors, it's a separate deliberate palette (see above).

---

## 3. Typography

| Role | Font | Size | Weight | Tracking |
|---|---|---|---|---|
| Display / Hero | SF Pro Display (fallback: `-apple-system`, Inter) | 48–96px | 600–700 | -0.02em |
| Section headline | SF Pro Display | 28–40px | 600 | -0.01em |
| Body | SF Pro Text | 16–17px | 400 | normal |
| Caption / meta | SF Pro Text | 13px | 400 | 0.01em |
| Button label | SF Pro Text | 15–17px | 500–600 | normal |

**Rules:**
- Tight letter-spacing on large display type (negative tracking) — this alone reads as "premium."
- Line height: 1.1–1.2 for headlines, 1.5 for body.
- Never more than two font weights per screen (e.g. one Regular, one Semibold).
- Avoid all-caps except for small eyebrow labels with wide tracking (+0.08em).

---

## 4. Layout & Spacing

- **Base unit:** 8px (scale: 8, 16, 24, 32, 48, 64, 96, 128)
- **Section padding:** minimum 96–120px top/bottom on desktop, 64px on mobile
- **Max content width:** 1200px, centered, with generous side gutters (never edge-to-edge text)
- **Grid:** 12-column, but content rarely fills it — asymmetry and negative space are intentional
- **Corner radius:** 12–20px on cards (soft, not sharp; not overly rounded/pill either)

---

## 5. Imagery & Media

- Full-bleed hero images/video, no overlaid clutter — one headline, one subhead, one CTA max
- Photography: natural light, shallow depth of field, true-to-life color (no heavy filters)
- Product/UI shots: floated on clean backgrounds with soft, realistic shadows — never harsh drop-shadows
- Aspect ratios: consistent throughout a single flow (don't mix 1:1, 4:5, 16:9 in the same feed)

---

## 6. Components

### Navigation
- Transparent or blurred-glass bar (`backdrop-filter: blur(20px)`) over content, becomes solid on scroll
- Minimal items: logo + 3–5 text links max, generous letter-spacing
- No visual clutter — icons only where universally understood (search, cart, profile)

### Buttons
- **Primary:** solid `--accent`, white text, 980px radius (full pill) *or* 12px radius depending on direction — pick one and stay consistent
- **Secondary:** transparent with 1px border (`--divider`), text in `--text-primary`
- Height: 44–48px, generous horizontal padding (24–32px)
- Hover: subtle opacity/brightness shift (~90%), no scale/bounce

### Cards
- White or `--bg-elevated` fill, 16–20px radius, soft shadow: `0 4px 24px rgba(0,0,0,0.06)`
- Internal padding: 24–32px minimum
- One clear focal point per card (image or headline, not both competing)

### Dividers
- 1px hairlines, `--divider` color, full-bleed or inset — never bold rules

---

## 7. Motion

- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` — smooth deceleration, never elastic/bounce
- Duration: 200–400ms for UI transitions, 600–900ms for scroll-triggered reveals
- Parallax and fade-ins used sparingly — one signature moment per page, not scattered everywhere
- Hover states: opacity, subtle scale (1.02 max), or shadow lift — nothing dramatic

---

## 8. Voice & Microcopy

- Short, confident, lowercase-leaning sentence case ("Get started," not "GET STARTED NOW!!")
- No exclamation points, no hard-sell language
- Let the product speak — copy describes, doesn't sell
- Empty/error states: calm and clear, one sentence, no apology-stacking

---

## Implementation Checklist

- [ ] One accent color only, used on <10% of visible elements
- [ ] Negative letter-spacing on all display type
- [ ] Minimum 64px vertical rhythm between sections
- [ ] Soft shadows only — no hard drop-shadows or outlines on cards
- [ ] Motion uses ease-out curves, no bounce/spring
- [ ] Dark mode is a deliberate palette, not an inverted one