# SEO & Traffic Guide — Formulino

Target audience: Italian teachers. Primary language: Italian. Domain: `formulino.ginkgo3d.it`.

---

## 1. Foundation (one-time setup)

These are prerequisites. Without them, all other work has reduced effect.

### 1.1 Technical baseline — already done

- [x] `<title>` and `<meta name="description">` set in `frontend/src/index.html`
- [x] Canonical URL: `https://formulino.ginkgo3d.it/`
- [x] Open Graph and Twitter Card tags
- [x] `robots.txt` at `/robots.txt`
- [x] `sitemap.xml` at `/sitemap.xml`
- [x] Schema.org `WebApplication` structured data
- [x] `lang="it"` on `<html>`
- [x] Google Search Console verification tag

### 1.2 Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property → **URL prefix** → `https://formulino.ginkgo3d.it`
3. Verify ownership using the meta tag already in `index.html`
4. Go to **Sitemaps** → submit `https://formulino.ginkgo3d.it/sitemap.xml`
5. Check **Coverage** tab weekly — fix any "Excluded" or "Error" URLs

### 1.3 Validate structured data

Paste the source of `https://formulino.ginkgo3d.it` into [validator.schema.org](https://validator.schema.org) and confirm the `WebApplication` entity is parsed without errors.

### 1.4 PageSpeed / Core Web Vitals

Run [pagespeed.web.dev](https://pagespeed.web.dev) on `https://formulino.ginkgo3d.it`.
Target: LCP < 2.5 s, CLS < 0.1, INP < 200 ms.

The Nginx config already sets aggressive caching headers for static assets — the main risk is LCP on first load. Check if the icon images (`ginkgo.png`, `web-app-manifest-512x512.png`) are optimised (WebP preferred).

---

## 2. On-page content

### 2.1 Page title strategy

| Route | Current title | Notes |
|---|---|---|
| `/` | `Formulino – Crea Google Form con il tuo assistente AI` | Good — clear value prop for teachers |
| `/privacy` | `Privacy Policy | Formulino` | Correct |

If new routes are added (e.g. `/templates`, `/docs`), each must have a unique `<title>` and `<meta description>` set via Angular's `Title` and `Meta` services.

### 2.2 Improve copy for Italian teachers

The current hero tagline is driven by the i18n service (`appTagline` key). Consider a/b testing Italian variants aimed at teachers:

- "Crea Google Form in secondi — per insegnanti"
- "Dalle domande al form in un clic. Con l'AI."

The description copy should reference the teacher use case explicitly, not just the technical functionality.

### 2.3 Add an FAQ section (future)

Search engines surface FAQ rich results. A short Italian FAQ on the homepage would help:

- "Come creo un Google Form con Formulino?"
- "Formulino è gratuito?"
- "Serve un account Google?"

Add `FAQPage` structured data when this section is built.

---

## 3. Link building — Italian teacher communities

Links from relevant Italian education sites carry high weight for this audience.

### Online communities to engage

| Community | Where | How |
|---|---|---|
| **Didattica Digitale** | Facebook group (large teacher community) | Share a short tutorial post with a link |
| **Classi 2.0** | Facebook group | Share use case: "creare verifiche in 30 secondi" |
| **Insegnare con le TIC** | Facebook group | Post a practical example with JSON + resulting form |
| **Reddit r/italy** | reddit.com | Show & Tell — post a demo |
| **Telegram: Insegnanti Italiani** | Various channels | Share the tool with a screenshot |
| **LinkedIn** | Italian teachers / educational technology | Post a use case as Michele Pasetto |

### Directory submissions

- Submit to **EduTech Italia** directories if they accept tool listings
- List on **Product Hunt** (English) for international reach + a backlink
- Submit to **alternativeto.net** as an alternative to manual Google Forms creation

---

## 4. Content strategy

Creating content is the highest-leverage long-term traffic driver. Suggested content in Italian:

### Short written tutorials (can be hosted as blog posts or Notion pages with a link back)

1. "Come creare una verifica con Formulino in 2 minuti" — step-by-step with screenshots
2. "Usa l'AI per generare domande a risposta multipla: guida per insegnanti"
3. "Google Form vs Formulino: quando ha senso usare un generatore JSON"
4. "5 template di questionario pronti per la classe"

### Video content (high reach for teachers)

- YouTube Shorts (60–90 s): screen recording of the full flow — paste JSON, click Create, form appears
- A longer tutorial (5 min) for YouTube search: "come creare google form automaticamente"
- Instagram Reels / TikTok: same short clip, targeting `#insegnanti #googleforms #scuoladigitale`

### Keywords to target

Primary (high intent):
- `crea google form con AI`
- `google form assistente AI`
- `generatore google form`
- `google forms italiano gratis`

Long-tail (teacher-specific):
- `come creare verifica google form velocemente`
- `google form per insegnanti`
- `questionario scuola google forms`
- `creare sondaggio classe google`

---

## 5. Performance checklist

- [ ] Images: convert `ginkgo.png` and manifest icons to WebP
- [ ] Check that Nginx is sending `Cache-Control: public, immutable` for hashed JS/CSS bundles (already configured)
- [ ] Verify `robots.txt` at `https://formulino.ginkgo3d.it/robots.txt` returns 200 after deploy
- [ ] Verify `sitemap.xml` at `https://formulino.ginkgo3d.it/sitemap.xml` returns 200 after deploy
- [ ] Check that `<link rel="canonical">` matches the actual URL (no trailing slash inconsistency)

---

## 6. Measurement

Check these monthly — no more, no less at this stage:

| Tool | What to check |
|---|---|
| Google Search Console | Total clicks, impressions, average position for top queries |
| Search Console → Coverage | Any new "Error" or "Excluded" URLs |
| Search Console → Core Web Vitals | LCP/CLS/INP field data |
| PageSpeed Insights | Score regression after deploys |
| Search Console → Rich Results | Whether structured data is being parsed |

**Do not** install analytics (GA4, Plausible) until you have enough traffic to make the data meaningful. Focus on Search Console first.

---

## 7. Quick wins — do these this week

1. Submit sitemap to Google Search Console
2. Post in one Italian teacher Facebook group with a real use case
3. Convert the OG image (`web-app-manifest-512x512.png`) to have Formulino branding visible at 512×512 (current icon may be generic)
4. Add `hreflang` tags if you plan to support both Italian and English URLs long-term
