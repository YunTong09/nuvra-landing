# Company Landing Page

A responsive company landing page built for Task 1 of a Full Stack Developer internship. **Nuvra** is a fictional software studio with a black identity with green, blue, and purple gradient accents, an original CSS architecture illustration, and concise service content.

## Technologies

- React
- TypeScript
- Vite
- CSS

## Installation

```bash
npm install
```

Use Node.js 22.12+ or a supported newer LTS version.

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
```

Preview the build with `npm run preview`. Run `npm run lint` for static lint checks.

## Project Structure

- `src/components/` — navigation, hero, about, services (including a reusable service card), benefits, statistics, contact, footer, and shared icons.
- `src/data/companyData.ts` — typed navigation, service, benefit, and statistics data.
- `src/App.tsx` — page composition.
- `src/index.css` — design tokens, shared styles, interactions, and responsive layouts.
- `public/favicon.svg` — original brand favicon.

## Behaviour and Accessibility

Includes smooth section navigation, active navigation indicators, keyboard focus styles, a skip link, reduced-motion support, and a mobile menu that closes on link selection or Escape. The contact dialog uses native modal keyboard behaviour and browser form validation.

This is a frontend-only portfolio project. The company, statistics, and contact address are illustrative. The enquiry form explicitly previews locally: it does not transmit or persist data. Google Fonts are optional; system sans-serif fallbacks keep the page usable offline. No image services or backend are required.
