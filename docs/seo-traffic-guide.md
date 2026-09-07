# SEO & Traffic Guide — Formulino

Target audience: Italian teachers. Primary language: Italian. Domain: `formulino.michelepasetto.it`.

---

## 0. Brand name situation: "Formulino" vs the Ferrari cat

The name "Formulino" is strongly associated with the famous stray cat that lived at Ferrari's Maranello circuit and died in 2024. Searching for "formulino" currently returns the cat almost exclusively.

**What this means in practice:**

- Google hasn't yet built a distinct entity for the app — it simply hasn't seen enough signals.
- Ranking for the bare keyword "formulino" will take months and depends on building authority. Do not chase it first.
- Instead, dominate compound queries where the cat has zero presence: `formulino app`, `formulino google form`, `formulino crea form`, `formulino insegnanti`.

**Brand name strategy:**

1. Use "Formulino" as the first word in every title, heading, and structured data name — Google learns associations from repetition.
2. In outreach posts (Facebook groups, Telegram, LinkedIn) always pair the name with the action: *"Con Formulino crei un Google Form in 30 secondi"*. This trains the web's co-occurrence graph.
3. If you get mentions on external sites (blog posts, reviews, directories), ensure they link with anchor text "Formulino" or "Formulino app" — not just the URL.
4. The FAQPage structured data now includes "Cos'è Formulino?" as the first question — this directly signals to Google that the name refers to a web application.

Over 6–12 months of consistent presence, Google will build its own entity understanding of Formulino as a software tool alongside the cat. You are not competing with the cat for emotional resonance — you are carving out a distinct entity in Google's knowledge graph.

---

## 1. Foundation (one-time setup)

These are prerequisites. Without them, all other work has reduced effect.

### 1.1 Technical baseline — already done

- [x] `<title>` and `<meta name="description">` set in `frontend/src/index.html`
- [x] Canonical URL: `https://formulino.michelepasetto.it/`
- [x] Open Graph and Twitter Card tags (`summary_large_image`)
- [x] `robots.txt` at `/robots.txt`
- [x] `sitemap.xml` at `/sitemap.xml` (with `lastmod` dates)
- [x] Schema.org `WebApplication` structured data (expanded: audience, featureList, inLanguage, isAccessibleForFree)
- [x] Schema.org `FAQPage` structured data (5 questions in Italian)
- [x] Crawler-visible static HTML inside `<app-root>` (h1, description, FAQ `<dl>`)
- [x] `lang="it"` on `<html>`
- [x] `<meta name="application-name">` set
- [x] Google Search Console verification tag

### 1.2 Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property → **URL prefix** → `https://formulino.michelepasetto.it`
3. Verify ownership using the meta tag already in `index.html`
4. Go to **Sitemaps** → submit `https://formulino.michelepasetto.it/sitemap.xml`
5. Check **Coverage** tab weekly — fix any "Excluded" or "Error" URLs

### 1.3 Validate structured data

Paste the source of `https://formulino.michelepasetto.it` into [validator.schema.org](https://validator.schema.org) and confirm the `WebApplication` entity is parsed without errors.

### 1.4 PageSpeed / Core Web Vitals

Run [pagespeed.web.dev](https://pagespeed.web.dev) on `https://formulino.michelepasetto.it`.
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

### 2.3 FAQ section — done

The homepage now has crawler-visible FAQ content in the static HTML (`<app-root>`) and `FAQPage` JSON-LD structured data in `<head>`. Five questions in Italian covering: cos'è Formulino, è gratuito, come funziona, serve un account Google, tipi di domande.

Google may surface FAQ rich results in SERP once the page is indexed and the structured data is validated. Check **Search Console → Rich Results** after the next crawl.

Next step: add a visible FAQ accordion to the Angular app so the content is present after JS loads too (improves eligibility for rich results).

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
- [ ] Verify `robots.txt` at `https://formulino.michelepasetto.it/robots.txt` returns 200 after deploy
- [ ] Verify `sitemap.xml` at `https://formulino.michelepasetto.it/sitemap.xml` returns 200 after deploy
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
