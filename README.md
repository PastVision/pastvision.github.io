# PastVision

Personal engineering identity and independent project portfolio.

## Stack

- Astro (static output)
- TypeScript for curated portfolio data
- Vanilla CSS and browser JavaScript
- Markdown-ready journal content
- GitHub Pages deployment

## Local development

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Deploying to GitHub Pages

1. Push this project to `PastVision/pastvision.github.io`.
2. In GitHub, open **Settings → Pages**.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Push to `master` (or manually run the workflow).
5. Keep the `CNAME` file containing `pastvision.in`.

The workflow in `.github/workflows/deploy.yml` builds Astro and deploys `dist/`.

## Content architecture

- `src/data/projects.ts` — curated project registry and metadata.
- `src/data/lab.ts` — areas of ongoing exploration.
- `src/pages/projects/[slug].astro` — generated project detail pages.
- `src/pages/journal/index.astro` — journal landing page.
- `src/styles/global.css` — design tokens and global visual system.
- `src/components/` — shared navigation, footer, cards and visual effects.

The website intentionally does not scrape GitHub READMEs at build time. Portfolio copy and presentation remain curated and stable even when repository documentation is incomplete.

## Before public launch

- Review the project descriptions and links.
- Add screenshots or demonstrations where available.
- Review older repositories for credentials, internal hostnames, personal data and third-party assets.
- Confirm GitHub Pages is configured to use GitHub Actions.
