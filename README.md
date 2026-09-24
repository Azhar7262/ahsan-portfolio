# Ahsan Ilyas — Portfolio Website

Personal portfolio website for **Ahsan Ilyas**, IT Support Executive & Systems/Networking Professional in Islamabad, Pakistan.

Built with **Node.js (Express + EJS)** — server-rendered, dynamic, with a working contact form and CV download.

## Features

- Single-page layout: Hero, About, Skills, Experience timeline, Education, Contact
- **Contact form** with validation, honeypot spam protection, and email delivery (optional SMTP)
- **CV download** at `/cv` with download counter
- SEO: meta tags, Open Graph, JSON-LD Person structured data
- Mobile-first responsive design, light/dark theme (system preference), WCAG AA accessible
- All content editable in **one file**: [`content.js`](content.js)

## Quick Start

```bash
npm install
npm start
# → http://localhost:3000
```

## Update the Content (no coding needed)

Open **`content.js`** and edit the text between quotes — name, skills, jobs, education, contact info, everything lives there.

### Add your CV

Drop your CV PDF at:

```
data/cv/cv.pdf
```

The "Download CV" button serves it as `Ahsan_Ilyas_CV.pdf` and counts downloads.

### Contact form email delivery (optional)

By default, form submissions are saved to `data/messages.json`. To get them **emailed** to you:

1. Copy `.env.example` to `.env`
2. Fill in your SMTP details (Gmail: use an [App Password](https://myaccount.google.com/apppasswords)):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
```

## Deploy (Render — free tier)

1. Push this repo to GitHub (already done)
2. Go to [render.com](https://render.com) → **New → Web Service** → connect the repo
3. Settings:
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
   - **Environment variable:** `SITE_URL` = `https://YOUR-APP-NAME.onrender.com` (shown after deploy)
4. Deploy — you get free HTTPS automatically
5. (Optional) Point a custom domain like `ahsanilyas.com` at it

Also works on Railway, Fly.io, or any Node host.

## Project Structure

```
├── server.js          # Express server, routes, form handling
├── content.js         # ★ ALL site content — edit this
├── views/index.ejs    # Page template
├── public/css         # Styles (navy/teal, light+dark)
├── public/js          # Nav toggle, form validation, email obfuscation
└── data/cv/cv.pdf     # Your CV goes here
```

## Roadmap (from PRD v1.0)

- **P1:** Services section, dark/light toggle, Projects/case studies, Certifications, LinkedIn/GitHub links
- **P2:** Blog/IT tips, testimonials, Urdu version, booking calendar
