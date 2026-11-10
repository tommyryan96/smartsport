# ÉireMetrics website

Static site for eiremetrics.com, deployed on Vercel.

## Pages
- `index.html`: homepage
- `services.html`: services (anchors: #match-report, #player-reports, #matchday, #opposition, #season-review)
- `reports.html`: sample report
- `contact.html`: booking form (sends to eiremetrics@gmail.com via FormSubmit)
- `about.html`: old design, to be rebuilt
- `app/`: demo dashboard

## Styles
Styles are built with Tailwind CSS v4 from `src/site.css` into `assets/site.css`.
Brand colours (green and orange from the logo) are set in `src/site.css`.

After changing classes in any page, rebuild:

    npx @tailwindcss/cli -i src/site.css -o assets/site.css --minify

## Shared header and footer
The header, footer and mobile menu are written into each page by:

    python tools/layout.py

Edit the header or footer in `tools/layout.py`, run it, then rebuild the CSS.
