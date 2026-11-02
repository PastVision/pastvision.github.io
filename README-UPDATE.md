# PastVision repositories page theme fix

Overlay this file onto the root of the existing Astro repository:

- `src/pages/repositories/index.astro`

The repository index and file tree are generated dynamically by JavaScript. Astro component-scoped CSS does not match those runtime-created elements, which caused the browser default button styling visible in the screenshot. The page stylesheet is now global for this page, and dynamically created buttons have explicit theme/reset styling.

No JavaScript behavior or repository data loading was changed.
