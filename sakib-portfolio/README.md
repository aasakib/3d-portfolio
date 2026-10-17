# A. A. Sakib — 3D Portfolio

Scroll-driven 3D portfolio: a low-poly IT-office island (desk, live monitor, server rack, switch, router, cables with moving data packets, Wi-Fi pulse) built procedurally with **three.js**; the camera flies between spots as you scroll using **GSAP + ScrollTrigger**.

## Add your photo
Put your picture at `images/profile.jpg` (create the `images` folder). Until then the About section shows an "AS" badge.

## Run
Just open `index.html` in a browser (needs internet for the CDN libraries and fonts), or serve it locally:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy (free)
Drag the folder onto Netlify Drop, or push to GitHub and enable GitHub Pages / Vercel.

## Edit your content
- Text, experience, skills, project cards → `index.html`
- Colors → CSS variables at the top of `style.css`
- Scene & camera positions → `main.js` (`WAYPOINTS`)
- The contact form opens the visitor's email app addressed to you (no backend needed).
