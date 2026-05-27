# Contributing to GymAtlas

GymAtlas is a gym equipment discovery platform built with **Next.js 15 App Router**, **Tailwind CSS v4**, and an **Express** backend ([gym-data-engine](https://github.com/404abe/gym-data-engine)).

## Running locally

```bash
git clone https://github.com/404abe/gym-atlas-web.git
cd gym-atlas-web
npm install
cp .env.example .env.local   # fill in your API URL and Mapbox token
npm run dev
```

## Pull request guidelines

- **One feature per PR** — keep changes focused and reviewable.
- Run `npm run lint` before submitting and fix any errors.
- Follow the existing code style: Tailwind utility classes throughout, design tokens (`text-main`, `bg-surface`, `text-sub`, `border-border`, etc.) for themed values.
