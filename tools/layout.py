"""Apply the shared ÉireMetrics header, footer and stylesheet to every new-style page.

Run from the site folder:  python layout.py
"""
import re

PAGES = {
    "index.html": "/",
    "services.html": "/services.html",
    "reports.html": "/reports.html",
    "contact.html": "/contact.html",
}

LINKS = [
    ("/services.html", "Services"),
    ("/reports.html", "Sample report"),
    ("/about.html", "About"),
    ("/contact.html", "Contact"),
]


def header(active):
    desk = "\n      ".join(
        f'<a href="{h}" class="{"text-emerald-700 font-semibold" if h == active else "text-slate-700 hover:text-emerald-700 transition"}">{t}</a>'
        for h, t in LINKS
    )
    mob = "\n      ".join(
        f'<a href="{h}" class="py-2 {"text-emerald-700 font-semibold" if h == active else "text-slate-700"}">{t}</a>'
        for h, t in LINKS
    )
    return f'''<header class="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
  <div class="max-w-6xl mx-auto px-6">
    <div class="flex items-center justify-between h-18 py-3">
      <a href="/" class="flex items-center gap-3">
        <img src="/assets/eiremetrics-logo.png" class="h-11 w-11 object-contain" alt="">
        <span class="text-xl font-bold text-emerald-700">ÉireMetrics</span>
      </a>
      <nav class="hidden md:flex items-center gap-8 font-medium" aria-label="Main">
      {desk}
      </nav>
      <a href="/contact.html" class="hidden md:inline-flex bg-accent-600 hover:bg-accent-700 text-white rounded-xl px-5 py-3 font-semibold transition">Book a free analysis</a>
      <button id="mobile-menu-button" class="md:hidden p-2 text-emerald-700" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
    <nav id="mobile-menu" class="hidden md:hidden flex-col gap-1 pb-5 font-medium" aria-label="Mobile">
      {mob}
      <a href="/contact.html" class="mt-3 bg-accent-600 text-white rounded-xl px-5 py-3 font-semibold text-center">Book a free analysis</a>
    </nav>
  </div>
</header>'''


FOOTER = '''<footer class="bg-emerald-900 text-emerald-100">
  <div class="max-w-6xl mx-auto px-6 py-14 grid sm:grid-cols-3 gap-10">
    <div>
      <p class="text-xl font-bold text-white mb-3">ÉireMetrics</p>
      <p class="text-emerald-200">Match analysis for Ladies football teams across Ireland.</p>
    </div>
    <div>
      <p class="font-semibold text-white mb-3">Services</p>
      <ul class="space-y-2">
        <li><a href="/services.html#match-report" class="hover:text-white">Match reports</a></li>
        <li><a href="/services.html#player-reports" class="hover:text-white">Player reports</a></li>
        <li><a href="/services.html#matchday" class="hover:text-white">Matchday analyst</a></li>
        <li><a href="/services.html#opposition" class="hover:text-white">Opposition analysis</a></li>
      </ul>
    </div>
    <div>
      <p class="font-semibold text-white mb-3">Get in touch</p>
      <p class="mb-4"><a href="mailto:eiremetrics@gmail.com" class="hover:text-white underline underline-offset-4">eiremetrics@gmail.com</a></p>
      <a href="/contact.html" class="inline-block bg-accent-500 hover:bg-accent-600 text-white rounded-xl px-5 py-3 font-semibold transition">Book a free analysis</a>
    </div>
  </div>
  <div class="border-t border-emerald-800">
    <div class="max-w-6xl mx-auto px-6 py-6 text-sm text-emerald-300 flex flex-wrap justify-between gap-2">
      <p>© 2026 ÉireMetrics</p>
      <p>Built in Ireland</p>
    </div>
  </div>
</footer>'''

SCRIPT = '''<script>
  const menuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  menuButton.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("hidden") === false;
    mobileMenu.classList.toggle("flex", open);
    menuButton.setAttribute("aria-expanded", open);
  });
</script>'''

HEAD_ASSETS = '''<link rel="icon" href="/assets/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/site.css">'''

for path, active in PAGES.items():
    s = open(path, encoding="utf-8").read()

    # Head: drop the Tailwind CDN, old font links and inline font styles; add the built stylesheet
    s = re.sub(r'\s*<script src="https://cdn\.tailwindcss\.com"></script>', "", s)
    s = re.sub(r'\s*<link rel="(?:icon|preconnect|stylesheet)"[^>]*>', "", s)
    s = re.sub(r'\s*<link href="https://fonts\.googleapis\.com[^>]*>', "", s)
    s = re.sub(r'\s*<style>\s*body\s*\{[^<]*?font-family[^<]*?</style>', "", s, flags=re.S)
    s = s.replace("</head>", "  " + HEAD_ASSETS + "\n</head>", 1)

    # Body background
    s = re.sub(r'<body class="[^"]*">', '<body class="bg-cream text-slate-900 antialiased">', s, count=1)

    # Header, footer, menu script
    s = re.sub(r"<header\b.*?</header>", lambda _: header(active), s, count=1, flags=re.S)
    if "<footer" in s:
        s = re.sub(r"<footer\b.*?</footer>", lambda _: FOOTER, s, count=1, flags=re.S)
    else:
        s = s.replace("</body>", FOOTER + "\n</body>", 1)
    s = re.sub(r"<script>\s*const (?:menuButton|button) = document\.getElementById\(\"mobile-menu-button\"\);.*?</script>\s*", "", s, flags=re.S)
    s = s.replace("</body>", SCRIPT + "\n</body>", 1)

    open(path, "w", encoding="utf-8").write(s)
    print("updated", path)
