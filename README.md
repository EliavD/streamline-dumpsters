# Streamline Dumpsters Ltd. — Website

Static marketing site for Streamline Dumpsters (Dublin, OH) plus the online booking flow.
Hand-authored static HTML deployed to Firebase Hosting (no build step / no shared templates —
headers, footers, and structured data are duplicated inline on each page).

## Review Count & Rating — Single Source of Truth

The site shows a Google review **count** and **rating** in several places. Because there's no
build step and the JSON-LD `aggregateRating` blocks must stay server-rendered (Google needs to
read them without executing JS), these values are hardcoded per file and kept in sync by hand.

**This section is the source of truth. When the numbers change, update every location below.**

### Canonical values (as of last update)

| Field | Value |
|-------|-------|
| `reviewCount` | **25** |
| `reviewRating` (`ratingValue`) | **5.0** |

The rating is `5.0` everywhere and rarely changes. The count is the value that drifts — update it
here first, then every instance in the checklist.

### Find every instance in one pass

```bash
grep -rn 'reviewCount\|review-count">\|reviews-count">\|google-badge__count">\|stars, [0-9]* Google reviews\|· [0-9]* Google Reviews' *.html
```

Every **visible** (non-JSON-LD) instance is tagged with this marker on the line above it:

```html
<!-- REVIEW COUNT: update all instances, see README.md -->
```

### Checklist — every place the count lives (16 total: 7 JSON-LD + 9 visible)

Line numbers are approximate (they shift as pages change); the grep above is authoritative.

**index.html (4)**
- [ ] ~L134 — JSON-LD `"reviewCount": "25"`
- [ ] ~L724 — hero badge `aria-label="… 5.0 stars, 25 Google reviews"`
- [ ] ~L734 — hero badge visible `<span class="google-badge__count">25 reviews</span>`
- [ ] ~L1010 — testimonial `<span class="reviews-count">· 25 Google Reviews</span>`

**Location pages — JSON-LD + a visible `review-count` (2 each, 12 total)**
- [ ] `dublin.html` — JSON-LD ~L187 · visible ~L553
- [ ] `hilliard.html` — JSON-LD ~L151 · visible ~L525
- [ ] `powell.html` — JSON-LD ~L151 · visible ~L517
- [ ] `upper-arlington.html` — JSON-LD ~L166 · visible ~L587
- [ ] `plain-city.html` — JSON-LD ~L155 · visible ~L521
- [ ] `worthington.html` — JSON-LD ~L151 · visible ~L518

### Notes / out of scope

- **JSON-LD stays static.** Do not move `aggregateRating` into JS — Google must see it in the
  server-rendered HTML. HTML comments can't live inside a `<script type="application/ld+json">`
  block (JSON has no comments), so JSON-LD instances are tracked by this checklist only.
- `js/reviews.js` holds an 18-review testimonial array for the on-page carousel — that's the
  subset shown, **not** the Google total. Leave it alone when updating the count.
- `js/config.js` is booking/payment config, unrelated to reviews.

> Note: this repo's `.gitignore` excludes `*.md` except `README.md`, so this file is the correct
> tracked home for the checklist.
