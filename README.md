# A. A. Sakib — 3D Portfolio

Scroll-driven 3D portfolio: a low-poly IT-office island (desk, live monitor, server rack, switch, router, cables with moving data packets, Wi-Fi pulse, orbit rings, sparkles) built procedurally with **three.js**; the camera flies between spots as you scroll using **GSAP + ScrollTrigger**. Your cut-out portrait floats in the scene and pops out of the About card.

## Run
Open `index.html` in a browser (internet needed for the CDN libraries and fonts), or serve locally:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy (free)
Drag the folder onto Netlify Drop, or push to GitHub and enable GitHub Pages / Vercel.

## Edit
- Text, experience, skills, project cards → `index.html`
- Colors → CSS variables at the top of `style.css`
- Scene & camera positions → `main.js` (`WAYPOINTS`)
- Resume file → replace `resume/A_A_Sakib_Resume.pdf` (keep the same name)
- Photo → `images/cutout.png` is the transparent portrait used on the page; `photo-data.js` is the same image embedded for the 3D scene. If you change your photo, replace both.
