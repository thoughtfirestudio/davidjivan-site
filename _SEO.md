# SEO & AI Search — Approach and Best Practices

**Last updated: 2026-07-12**

This documents the search strategy for davidjivan.net. The site is optimized for two audiences: traditional search engines (Google) and AI/LLM crawlers (ChatGPT, Claude, Perplexity). The strategy is: make the content machine-readable without degrading the human reading experience.

---

## Why plain HTML wins for search in 2026

The site is plain HTML with semantic markup. No JavaScript frameworks. No client-side rendering. No SPAs.

**For Google:** Crawlers parse HTML directly. No headless browser needed. Every `<h1>`, `<p>`, `<meta>` tag is immediately available. Core Web Vitals are trivially good because there's nothing to load. Page speed is effectively instant.

**For LLMs:** ChatGPT, Claude, and Perplexity scrape web pages as training data and for real-time search. They parse HTML the same way Google does — but they're even more dependent on clean markup, because they can't execute JavaScript at all. A React SPA that renders nothing without hydration is invisible to an LLM. Our plain HTML is fully readable.

**The accidental advantage:** We stripped JetBrains Mono (external font request), deleted build pipelines, and removed all JS dependencies except `components.js` (font size controls, local only) and `track.js` (analytics). Every page is a self-contained HTML document with zero render-blocking resources. This is ideal for both crawler types.

---

## What's implemented

### Crawler infrastructure

| File | Purpose |
|------|---------|
| `robots.txt` | Allows all crawlers. Explicitly whitelists GPTBot, Claude-Web, anthropic-ai, PerplexityBot. Points to sitemap. Disallows internal pages (`/i-am-david.html`, `/reader/`, `/showcase.html`) |
| `sitemap.xml` | 34 URLs: 24 published posts + homepage + about + 8 wiki pages. Auto-generated from `posts.json`. Draft posts excluded. Monthly changefreq for posts, yearly for wiki |
| `llms.txt` | The emerging standard for LLM crawlers (adopted by OpenAI, Anthropic). Markdown-formatted site overview at `/llms.txt`. Curated list of key pages organized by topic with descriptions. Serves as both crawl map and content summary |

### Per-page metadata (every published post + homepage + about)

| Tag | Purpose |
|-----|---------|
| `<meta name="description">` | 150-160 char description. Appears in Google search snippets and LLM summaries. Already present on all posts |
| `<meta property="og:title">` | Open Graph title. Used by Facebook, Twitter, Slack, iMessage for link previews |
| `<meta property="og:description">` | OG description. Same as meta description for consistency |
| `<meta property="og:url">` | Canonical URL. Prevents duplicate content issues |
| `<meta property="og:type">` | `article` for posts, `website` for homepage |
| `<meta property="og:site_name">` | "David Jivan" — consistent branding in link previews |
| `<meta name="twitter:card">` | `summary` card type. Shows title + description when shared on X |
| `<link rel="canonical">` | Canonical URL. Tells Google this is the authoritative version |
| `<script type="application/ld+json">` | Schema.org JSON-LD. Structured data markup (`Article` type with headline, description, author, date). This is what powers Google's rich results and knowledge panels |

### Structural advantages

- **Semantic HTML:** Every page uses proper `<h1>`, `<h2>`, `<article>`, `<p>` hierarchy. Crawlers understand content structure without guessing.
- **No paywalls or login gates:** All content is freely accessible. Crawlers never hit auth walls.
- **Clean URL structure:** `/posts/slug.html` — no query parameters, no hash fragments, no session IDs.
- **`posts.json` as machine-readable index:** A JSON array of {title, slug, date, tags} at `/posts.json`. Useful for both our own scripting and any crawler that parses JSON endpoints.
- **Self-hosted analytics (`track.js`):** No third-party scripts that slow down crawls or leak data.

---

## What still needs doing

### 1. Google Search Console registration (manual — requires David)

Go to [search.google.com/search-console](https://search.google.com/search-console) and add `davidjivan.net` as a property. Verification options:
- **DNS TXT record** (recommended, survives deploys): Add the provided TXT record via Cloudflare Manager
- **HTML file upload** (simpler): Download the verification HTML file and commit to `site/`

Once verified, submit the sitemap: `https://davidjivan.net/sitemap.xml`

**Why this matters:** Without Search Console, Google will still crawl the site (eventually), but you can't see indexing status, fix errors, or request re-crawls. With it, you can see which pages are indexed, which have errors, and what search queries are bringing traffic.

### 2. Performance audit

The site is already fast (no JS frameworks, no external fonts), but run these checks:

```bash
# Check page speed
curl -s -o /dev/null -w "%{time_total}s %{size_download}bytes" https://davidjivan.net/

# Validate HTML
# Use https://validator.w3.org/ to check any page

# Check mobile friendliness
# Use https://search.google.com/test/mobile-friendly
```

Expected: sub-500ms response times, sub-20KB page sizes. If pages are larger, check for inline `<style>` blocks or large images.

### 3. Structured data validation

After each new post, validate the Schema.org markup:

```
https://validator.schema.org/ — paste a post URL to verify JSON-LD is valid
https://search.google.com/test/rich-results — see how Google renders the page
```

### 4. Image alt text (future)

Currently the site has no images. If images are added later:
- Every `<img>` needs an `alt` attribute with descriptive text
- Use SVG for diagrams (smaller, scalable, searchable)
- Add `og:image` and `twitter:image` meta tags pointing to a 1200×630px social preview image

### 5. RSS / Atom feed (desirable)

An RSS feed at `/feed.xml` would:
- Let people subscribe via RSS readers
- Give crawlers a machine-readable update stream
- Help with indexing speed (crawlers check feeds more frequently than sitemaps)

Implement by auto-generating from `posts.json` in the same pattern as `sitemap.xml`.

### 6. Blogging / content pattern

For SEO, the single most impactful thing is **regular publishing**. A site that updates monthly gets crawled more frequently than one that updates yearly. The syllogisms are the entry point, but new content signals to crawlers that the site is active.

**Best publishing cadence for crawl frequency:** at least monthly, ideally bi-weekly.

### 7. Backlink strategy (long-term)

Google's algorithm still weights backlinks heavily. LLMs weight citation frequency in training data. Both converge on: **get cited by other sites**.

Practical paths:
- Guest posts on philosophy/theology blogs linking back
- Citations from academic or reference sites
- Social sharing that generates organic links
- Being referenced in newsletters, Substacks, Reddit threads, Hacker News

The content itself is the best backlink magnet — original, well-argued, not available elsewhere. The "gap this fills" (AGENTS.md) is the SEO proposition: nobody else is doing this exact synthesis. That uniqueness drives citations.

---

## The AI search difference

Traditional SEO optimizes for Google's ranking algorithm. AI search optimizes for **content quality and citability**.

**What Google cares about:**
- Keywords in titles, headings, meta descriptions
- Page speed, mobile friendliness, Core Web Vitals
- Backlink count and authority
- Structured data (Schema.org)
- Freshness (recently updated content)

**What LLMs care about:**
- Clean, parseable HTML (no JS rendering)
- Semantic structure (real headings, not div-soup)
- Content being **actually good** (LLMs are trained on quality, not keywords)
- Citation frequency in training data
- `llms.txt` for crawl optimization

**Key insight:** The Venn diagram overlaps significantly. Good semantic HTML, clear structure, descriptive metadata, and actually good content serve both. The difference is that LLMs can't be "optimized for" in the traditional sense — you can't keyword-stuff your way into an LLM's training data. You have to actually be worth citing.

This is an advantage for David's site. The content is original, philosophical, and fills a genuine gap. It's the kind of content LLMs are specifically trained to surface — expert-written, well-structured, unique perspective.

---

## Quick checklist for new posts

Before publishing a new post, verify:

- [ ] Meta description is 150-160 characters, compelling, unique
- [ ] Title is descriptive, includes key terms naturally
- [ ] Heading hierarchy is correct (h1 → h2 → h3, no skips)
- [ ] `posts.json` entry added with proper slug, date, tags
- [ ] OG + Twitter + Schema + canonical tags present (auto-added by `scripts/add-seo-tags.js`)
- [ ] If the post replaces or updates an older one, add 301 redirect or update the old post
- [ ] Sitemap regenerated (`node scripts/gen-sitemap.js`)
- [ ] `llms.txt` updated if the post is significant enough to feature

---

## Regeneration scripts

```bash
# Regenerate sitemap after adding/removing posts
node scripts/gen-sitemap.js

# Add SEO meta tags to all posts (run after creating new posts)
node scripts/add-seo-tags.js
```

Both scripts read `posts.json` and respect the `draft` flag. Draft posts are excluded from sitemap and not tagged with SEO metadata.
