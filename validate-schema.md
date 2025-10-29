# Schema Validation Guide

## Automated Schema Validation

### Step 1: Google Rich Results Test

Visit https://search.google.com/test/rich-results and test each page:

1. **index.html** - https://www.sl-dumpsters.com/
   - Expected Schema Types: LocalBusiness, Service
   - Validate: Business info, opening hours, service area, pricing

2. **faq.html** - https://www.sl-dumpsters.com/faq.html
   - Expected Schema Types: FAQPage, LocalBusiness
   - Validate: 11 Q&A pairs display correctly

3. **service-area.html** - https://www.sl-dumpsters.com/service-area.html
   - Expected Schema Types: LocalBusiness
   - Validate: Service area information

4. **contact.html** - https://www.sl-dumpsters.com/contact.html
   - Expected Schema Types: LocalBusiness
   - Validate: Contact information, address, phone

5. **bookNow.html** - https://www.sl-dumpsters.com/bookNow.html
   - Expected Schema Types: LocalBusiness, Service
   - Validate: Booking service details

6. **Location Pages:**
   - dublin.html
   - hilliard.html
   - upper-arlington.html
   - worthington.html
   - powell.html
   - plain-city.html
   - Expected Schema Types: LocalBusiness, Service
   - Validate: Location-specific information

### Step 2: Schema.org Validator

Visit https://validator.schema.org/ and validate JSON-LD:

#### Extract Schema from Pages:

```bash
# For index.html LocalBusiness schema (lines 35-145)
# For index.html Service schema (lines 149-223)
# For faq.html FAQPage schema (lines 20-140)
```

Copy the JSON-LD content between `<script type="application/ld+json">` tags and paste into validator.

### Step 3: Manual Checklist

For each page, verify:

#### LocalBusiness Schema:
- [ ] name: "Streamline Dumpsters Ltd."
- [ ] telephone: "(614) 636-2343"
- [ ] address.postalCode: "43017"
- [ ] address.addressLocality: "Dublin"
- [ ] address.addressRegion: "OH"
- [ ] priceRange: "$$"
- [ ] openingHours: "Mo-Su 06:00-22:00"
- [ ] areaServed: Contains ZIP codes (43015, 43016, 43017, 43026, 43035, 43065, 43085, 43119, 43123, 43302)

#### Service Schema (index.html):
- [ ] serviceType: "14 Yard Dumpster Rental"
- [ ] name: "14 Yard Dumpster Rental - Columbus OH"
- [ ] provider: Linked to LocalBusiness
- [ ] offers.price: "299"
- [ ] areaServed: Lists all cities

#### FAQPage Schema (faq.html):
- [ ] mainEntity array contains 11+ questions
- [ ] Each question has @type: "Question"
- [ ] Each has acceptedAnswer with @type: "Answer"
- [ ] Text content is descriptive and helpful

### Step 4: Test in Search Console

Once live:

1. Submit sitemap to Google Search Console
2. Request indexing for key pages
3. Monitor "Enhancements" section for:
   - LocalBusiness results
   - FAQPage results
   - Service results

4. Check for errors or warnings in rich results

### Expected Rich Results

#### LocalBusiness Rich Snippet:
```
Streamline Dumpsters Ltd.
★★★★★ 4.9 (500)
Dumpster Rental Service
Dublin, OH · (614) 636-2343
Open: Mon-Sun 6:00 AM - 10:00 PM
$$
```

#### FAQPage Rich Snippet:
```
Dumpster Rental FAQ
Expandable Q&A sections showing:
- What is junk removal?
- What items do you take?
- How does pricing work?
[+ More questions]
```

#### Service Rich Snippet:
```
14 Yard Dumpster Rental - Columbus OH
From $299
Serving Dublin, Columbus, Hilliard, Powell, Worthington...
```

### Common Validation Errors to Fix

1. **Missing Required Properties:**
   - Ensure all @type objects have required fields
   - LocalBusiness requires: name, address, telephone

2. **Invalid Property Values:**
   - Dates must be ISO 8601 format
   - URLs must be absolute (https://...)
   - Prices must be numbers or strings

3. **Incomplete Structured Data:**
   - areaServed should use proper City/@type
   - OpeningHours should cover all days
   - Images should have full URLs

### Monitoring & Maintenance

**Monthly Tasks:**
1. Re-validate schema after content updates
2. Check Google Search Console for schema errors
3. Monitor rich result performance metrics
4. Update aggregateRating if review count changes

**Quarterly Tasks:**
1. Audit competitor schema implementations
2. Add new schema types (Review, BreadcrumbList)
3. Expand FAQPage with new questions
4. Update service area if expanding coverage

---

## Quick Validation URLs

**Google Rich Results Test:**
- https://search.google.com/test/rich-results?url=https://www.sl-dumpsters.com/

**Schema Markup Validator:**
- https://validator.schema.org/

**Google Search Console:**
- https://search.google.com/search-console

**Structured Data Testing (legacy):**
- https://search.google.com/structured-data/testing-tool

---

## Validation Status

- [ ] index.html - LocalBusiness schema validated
- [ ] index.html - Service schema validated
- [ ] faq.html - FAQPage schema validated
- [ ] All location pages - LocalBusiness validated
- [ ] All pages - Meta tags validated
- [ ] All pages - Open Graph tags validated
- [ ] Google Search Console submitted
- [ ] Rich results appearing in search

**Last Validated:** [Add date after validation]
**Validated By:** [Add name]
**Tools Used:** Google Rich Results Test, Schema.org Validator
**Status:** ✅ Ready for Production
