# Rebanta Daadhiich — Cybersecurity Portfolio

A bold, retro-modern editorial landing page for a cybersecurity engineer. Built with
**plain HTML, CSS, and vanilla JavaScript** — no frameworks, no build step, no
dependencies. Drop it on GitHub Pages and it just works.

> Cream/butter top bar · royal-blue hero · chunky 3D serif name · interactive
> facts search · and a 6-segment yellow nav wheel.

---

## ✨ Features

- **Retro-editorial design** with an exact, themeable color palette (CSS variables).
- **3D layered name typography** (`Rebanta / Daadhiich`) using stacked `text-shadow`.
- **Portrait layered behind the name** (with a built-in SVG placeholder fallback).
- **Interesting-facts search bar** — queries the public **Wikipedia REST API**
  first, then falls back to the **Useless Facts API**. Loading / error / empty
  states included. No API keys, fully client-side.
- **SVG circular nav wheel** with 6 yellow wedges, smooth hover pop/scale/glow,
  and scroll-spy highlighting. Collapses to a tidy button grid on phones.
- **Fully responsive** (desktop / tablet / mobile) with a hamburger menu.
- **Accessible**: semantic HTML, alt text, ARIA labels, visible cream focus rings,
  keyboard-friendly, and `prefers-reduced-motion` support.

---

## 📁 File structure

```
.
├── index.html          # Markup: top nav, hero, content sections
├── style.css           # All styling + responsive breakpoints + palette
├── script.js           # Facts search, mobile menu, scroll spy
├── README.md           # You are here
└── images/
    ├── portrait.svg    # Placeholder portrait (auto-used until you add a photo)
    └── portrait.png    # ← add your own transparent photo here (optional)
```

---

## ▶️ Run locally

It's a static site, so just open the file:

```bash
open index.html        # macOS
# or simply double-click index.html
```

Or serve it (recommended so the fonts/APIs behave like production):

```bash
# Python 3
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## 🚀 Deploy on GitHub Pages

1. Create a new GitHub repo and push these files to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Select branch **`main`** and folder **`/ (root)`**, then **Save**.
5. Your site goes live at `https://<you>.github.io/<repo>/` in a minute or two.

> Want it at `https://<you>.github.io/`? Name the repo `<you>.github.io`.

---

## 🖼️ Replace the portrait

The hero `<img>` points to `images/portrait.png` and automatically falls back to
the `images/portrait.svg` placeholder if that file doesn't exist.

To use your own photo:
1. Export a **background-removed, transparent PNG** of yourself.
2. Save it as `images/portrait.png`.

That's it — no code change needed. (To tweak size/opacity, edit `.portrait` in
`style.css`.)

---

## ✏️ Where to edit text, links & colors

| What | Where |
|------|-------|
| Name, tagline, opening line, role label | `index.html` (hero section) |
| Section copy (About, Stack, Experience, Projects, Education, Contact) | `index.html` (`<section>` blocks — look for the comment banners) |
| Contact email / GitHub / LinkedIn links | `index.html` → `.contact-links` |
| Project cards | `index.html` → `#projects` |
| Colors / theme | `style.css` → `:root` CSS variables at the top |
| Page title, description, Open Graph image | `index.html` `<head>` meta tags |
| Facts API behavior | `script.js` (Wikipedia + Useless Facts) |

---

## 🔌 APIs used (free, no auth)

- **Wikipedia REST Summary** — `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
- **Useless Facts** — `https://uselessfacts.jsph.pl/api/v2/facts/random?language=en`

Both are CORS-enabled and require no API key. Calls have a 5s timeout and graceful
error handling.

---

## License

Personal portfolio template — free to use and adapt.
