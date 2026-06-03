# Rebanta Daadhiich — Cybersecurity Portfolio

Personal portfolio for a cybersecurity graduate from Purdue University. Built with
**plain HTML, CSS, and vanilla JavaScript** — no frameworks, no build step, no
dependencies. Hosted on GitHub Pages.

**Live site:** https://Rebantaa.github.io

---

## ✨ Features

- macOS-inspired editorial design with a strict color palette (CSS variables)
- Circular hero portrait with cream border and layered 3D name typography
- Interactive facts search bar (Useless Facts API — no API key, fully client-side)
- SVG circular nav wheel with 6 segments, hover animations, scroll-spy
- Fully responsive (desktop / tablet / mobile) with hamburger menu
- Accessible: semantic HTML, ARIA labels, keyboard-friendly, `prefers-reduced-motion` support

---

## 📁 File structure

```
Rebantaa.github.io/
├── index.html               # All markup: nav, hero, sections, footer
├── style.css                # Styling, responsive breakpoints, CSS variables
├── script.js                # Facts search, mobile menu, timeline scroll-spy
├── .nojekyll                # Tells GitHub Pages not to run Jekyll
├── README.md
├── images/
│   ├── IMG_2827.JPG         # Hero portrait (circular frame in hero section)
│   ├── portrait.png         # Fallback portrait
│   └── portrait.svg         # SVG placeholder fallback
└── assets/
    └── Rebanta-Resume.pdf   # Resume — linked from About and Contact sections
```

---

## ▶️ Run locally

```bash
# Python 3
python3 -m http.server 8080
# then visit http://localhost:8080
```

---

## 🚀 Deploy on GitHub Pages

```bash
git init
git add .
git commit -m "Deploy personal portfolio"
git branch -M main
git remote add origin https://github.com/Rebantaa/Rebantaa.github.io.git
git push -u origin main
```

Then on GitHub:
1. Go to **Settings → Pages**
2. Under **Build and deployment → Source**, select **Deploy from a branch**
3. Branch: **main** | Folder: **/ (root)**
4. Click **Save**

Site goes live at **https://Rebantaa.github.io** within 1–2 minutes.

---

## 🖼️ Updating the portrait

Replace `images/IMG_2827.JPG` with your photo. Keep the same filename and path.
The `onerror` fallback will use `images/portrait.png` if the file is missing.

---

## 📄 Updating the resume

Replace `assets/Rebanta-Resume.pdf` with your latest PDF. Keep the exact filename —
both the About and Contact section buttons point to `./assets/Rebanta-Resume.pdf`.

---

## ✏️ Where to edit content

| What | Where |
|------|-------|
| Name, role, intro text | `index.html` → hero section |
| About, Stack, Experience, Projects, Education, Contact copy | `index.html` → respective `<section>` blocks |
| Contact email / GitHub / LinkedIn / Medium links | `index.html` → `.contact-links` |
| Colors / theme | `style.css` → `:root` CSS variables |
| Page title and meta description | `index.html` → `<head>` |

---

## 🔌 APIs used (free, no auth required)

- **Useless Facts** — `https://uselessfacts.jsph.pl/api/v2/facts/random?language=en`

CORS-enabled, no API key needed. Calls have a 5s timeout with graceful error handling
and a client-side content safety filter.
