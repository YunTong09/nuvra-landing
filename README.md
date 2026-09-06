# Voltix_intern

One-month internship at Voltix.

## Task 1 — Company Landing Page

A responsive landing page for **nuvra.**, a fictional software company. Built for a Full Stack Developer internship using React, TypeScript, Vite, and CSS. The page uses a dark header and hero, light content sections, and a green-to-blue gradient accent.

## Getting started

Use Node.js 22.12+ or a supported newer LTS version.

```bash
npm install
npm run dev
```

## Checks and production build

```bash
npm run lint
npm run build
npm run preview
```

`build` checks TypeScript and creates the production files in `dist`. `preview` serves that build locally.

## How the components work

`src/App.tsx` puts the existing page sections together in order:

- `Navbar.tsx` displays links and uses `useState` to open or close the mobile menu. A small `useRef` lets Escape return keyboard focus to the menu button.
- `Hero.tsx` contains a headline, a short description, and links to Contact and Services. It uses a simple single-column layout.
- `About.tsx` explains the company and its approach.
- `Services.tsx` maps service data into four reusable `ServiceCard` components. Each card receives one service through props.
- `Benefits.tsx` displays three benefits as a simple list.
- `Stats.tsx` maps four illustrative statistics into a description list.
- `CTA.tsx` contains a contact message and an email link. There is no form, dialog, or backend.
- `Footer.tsx` shows the company name, navigation, placeholder contact information, and copyright.
- `Icon.tsx` holds the shared brand and simple SVG service icons.

## Where TypeScript helps

`src/data/companyData.ts` defines `NavigationItem` and `Service` types, so each item has the fields its component needs. `IconName` lists the four allowed icon names. The `ServiceCard` props and menu button ref are also typed. The remaining simple arrays use TypeScript's automatic type inference.

## Styling and responsive layout

`src/index.css` contains colour variables, shared styles, a labelled block for each page section, and three width-based media queries:

- Above 1100px: four service cards per row. The hero stays a single column at every size.
- At 1100px and below: two service cards per row and smaller gaps.
- At 768px and below: a mobile menu, stacked About/Why Us content, and two statistics per row.
- At 480px and below: one service card per row and a stacked footer.

Layouts use CSS grid and flexbox. Links have visible keyboard focus styles, and reduced-motion preferences turn off smooth scrolling and transitions. System fonts avoid external font downloads.

## Demo content

The company and statistics are fictional. `hello@nuvra.example` is a placeholder email address: the contact link can open an email application, but it is not a working company inbox. Replace it with your real address before using the page for a real business.
