# SEO audit report

Generated from `dist/client` on 2026-10-26T08:58:46.202Z.

## Executive summary

- HTML pages audited: **89** (72 indexable, 17 utility/noindex)
- Sitemap URLs checked: **72** across 1 child sitemap(s)
- Indexable pages with zero findings: **72** (100% pass rate)
- Critical findings: **0**
- Quality findings: **0**
- Global health score: **100 / 100**

Health score is the percentage of indexable pages that pass every check, minus 5 points per sitemap-level critical finding (capped at 30 points). Utility routes (`/go/*`, `/404`, `/thank-you/`, `/recommendation/`) are audited for broken links and JSON-LD but are not required to be indexed or to hit the 400-word floor.

Visible words exclude `head`, `script`, `style`, `svg`, `nav`, and `footer`. Hidden words are text inside `class="hidden"` or the `hidden` attribute (including the lead modal). Script words are executable inline or embedded script text, not JSON-LD.

## Critical blockers

None. No canonical, robots, sitemap, broken-link, or JSON-LD failures were found on indexable URLs.

## Checks that passed

- Every indexable page has exactly one absolute, lowercase, trailing-slash canonical that matches its file.
- No public page is `noindex`. Utility noindex stays on `/go/*`, `/404`, `/thank-you/`, and `/recommendation/`.
- No indexable page, and not `/recommendation/`, is `nofollow`.
- All 72 URLs in `sitemap-index.xml` / `sitemap-0.xml` are live canonical 200s. No inverted slugs, legacy `-for-*` URLs, or redirects.
- No internal href points at a missing file or a 410.
- Every JSON-LD block parses.
- Every indexable page has exactly one non-empty h1.
- Every indexable page has at least one inbound internal link.
- No duplicate titles across indexable URLs.
- No duplicate meta descriptions across indexable URLs.

## Quality warnings

None.
## Pass table

Indexable URLs with one canonical, indexable robots, a single h1, in-range unique title and description, valid JSON-LD, no broken or redirecting internal links, no missing alts, enough visible copy, no script-bloat overflow, no residual inline handlers, and at least one inbound internal link.

| URL | Visible words | Title length | Description length |
| --- | ---: | ---: | ---: |
| https://www.thehrstackguide.com/about/ | 630 | 55 | 112 |
| https://www.thehrstackguide.com/affiliate-disclosure/ | 410 | 41 | 143 |
| https://www.thehrstackguide.com/applicant-tracking-systems/ | 644 | 53 | 147 |
| https://www.thehrstackguide.com/ashby-vs-bamboohr/ | 1401 | 53 | 126 |
| https://www.thehrstackguide.com/ashby-vs-breezy-hr/ | 1433 | 51 | 130 |
| https://www.thehrstackguide.com/ashby-vs-jazzhr/ | 1347 | 51 | 117 |
| https://www.thehrstackguide.com/ashby-vs-lever/ | 1370 | 50 | 124 |
| https://www.thehrstackguide.com/ashby-vs-recruitee/ | 1350 | 54 | 140 |
| https://www.thehrstackguide.com/ashby-vs-workable/ | 1370 | 53 | 136 |
| https://www.thehrstackguide.com/breezy-hr-vs-bamboohr/ | 1454 | 54 | 129 |
| https://www.thehrstackguide.com/breezy-hr-vs-jazzhr/ | 1400 | 52 | 120 |
| https://www.thehrstackguide.com/breezy-hr-vs-recruitee/ | 1396 | 55 | 143 |
| https://www.thehrstackguide.com/contact/ | 419 | 31 | 140 |
| https://www.thehrstackguide.com/deel-vs-gusto/ | 1589 | 49 | 117 |
| https://www.thehrstackguide.com/deel-vs-multiplier/ | 1578 | 54 | 126 |
| https://www.thehrstackguide.com/deel-vs-oyster-hr/ | 1605 | 53 | 126 |
| https://www.thehrstackguide.com/deel-vs-papaya-global/ | 1597 | 57 | 137 |
| https://www.thehrstackguide.com/deel-vs-payoneer-workforce-management/ | 1687 | 52 | 143 |
| https://www.thehrstackguide.com/deel-vs-remote/ | 1559 | 50 | 124 |
| https://www.thehrstackguide.com/deel-vs-remote-people/ | 1701 | 57 | 137 |
| https://www.thehrstackguide.com/deel-vs-rippling/ | 1583 | 52 | 125 |
| https://www.thehrstackguide.com/global-payroll-eor/ | 792 | 51 | 156 |
| https://www.thehrstackguide.com/gusto-vs-multiplier/ | 1572 | 55 | 124 |
| https://www.thehrstackguide.com/gusto-vs-papaya-global/ | 1591 | 58 | 135 |
| https://www.thehrstackguide.com/gusto-vs-payoneer-workforce-management/ | 1673 | 53 | 141 |
| https://www.thehrstackguide.com/gusto-vs-remote-people/ | 1704 | 58 | 135 |
| https://www.thehrstackguide.com/how-to-build-an-hr-tech-stack/ | 780 | 63 | 153 |
| https://www.thehrstackguide.com/ | 532 | 59 | 137 |
| https://www.thehrstackguide.com/jazzhr-vs-bamboohr/ | 1359 | 54 | 116 |
| https://www.thehrstackguide.com/jazzhr-vs-recruitee/ | 1308 | 55 | 130 |
| https://www.thehrstackguide.com/lattice-vs-culture-amp/ | 1351 | 58 | 138 |
| https://www.thehrstackguide.com/lever-vs-bamboohr/ | 1396 | 53 | 123 |
| https://www.thehrstackguide.com/lever-vs-breezy-hr/ | 1435 | 51 | 127 |
| https://www.thehrstackguide.com/lever-vs-jazzhr/ | 1346 | 51 | 114 |
| https://www.thehrstackguide.com/lever-vs-recruitee/ | 1349 | 54 | 137 |
| https://www.thehrstackguide.com/lever-vs-workable/ | 1369 | 53 | 133 |
| https://www.thehrstackguide.com/methodology/ | 729 | 52 | 131 |
| https://www.thehrstackguide.com/multiplier-vs-payoneer-workforce-management/ | 1670 | 58 | 150 |
| https://www.thehrstackguide.com/multiplier-vs-remote-people/ | 1691 | 63 | 144 |
| https://www.thehrstackguide.com/oyster-hr-vs-gusto/ | 1601 | 54 | 124 |
| https://www.thehrstackguide.com/oyster-hr-vs-multiplier/ | 1594 | 59 | 133 |
| https://www.thehrstackguide.com/oyster-hr-vs-papaya-global/ | 1621 | 62 | 144 |
| https://www.thehrstackguide.com/oyster-hr-vs-payoneer-workforce-management/ | 1706 | 57 | 150 |
| https://www.thehrstackguide.com/oyster-hr-vs-remote-people/ | 1724 | 62 | 144 |
| https://www.thehrstackguide.com/papaya-global-vs-multiplier/ | 1584 | 63 | 144 |
| https://www.thehrstackguide.com/papaya-global-vs-payoneer-workforce-management/ | 1699 | 61 | 157 |
| https://www.thehrstackguide.com/papaya-global-vs-remote-people/ | 1714 | 59 | 155 |
| https://www.thehrstackguide.com/payoneer-workforce-management-vs-remote-people/ | 1802 | 61 | 152 |
| https://www.thehrstackguide.com/performance-management/ | 858 | 52 | 152 |
| https://www.thehrstackguide.com/performyard-vs-culture-amp/ | 1343 | 62 | 129 |
| https://www.thehrstackguide.com/performyard-vs-lattice/ | 1320 | 58 | 128 |
| https://www.thehrstackguide.com/privacy-policy/ | 430 | 35 | 139 |
| https://www.thehrstackguide.com/recruitee-vs-bamboohr/ | 1366 | 57 | 139 |
| https://www.thehrstackguide.com/remote-vs-gusto/ | 1559 | 51 | 122 |
| https://www.thehrstackguide.com/remote-vs-multiplier/ | 1548 | 56 | 131 |
| https://www.thehrstackguide.com/remote-vs-oyster-hr/ | 1571 | 55 | 131 |
| https://www.thehrstackguide.com/remote-vs-papaya-global/ | 1567 | 59 | 142 |
| https://www.thehrstackguide.com/remote-vs-payoneer-workforce-management/ | 1657 | 54 | 148 |
| https://www.thehrstackguide.com/remote-vs-remote-people/ | 1678 | 59 | 142 |
| https://www.thehrstackguide.com/rippling-vs-gusto/ | 1570 | 53 | 123 |
| https://www.thehrstackguide.com/rippling-vs-multiplier/ | 1520 | 58 | 132 |
| https://www.thehrstackguide.com/rippling-vs-oyster-hr/ | 1593 | 57 | 132 |
| https://www.thehrstackguide.com/rippling-vs-papaya-global/ | 1535 | 61 | 143 |
| https://www.thehrstackguide.com/rippling-vs-payoneer-workforce-management/ | 1686 | 56 | 158 |
| https://www.thehrstackguide.com/rippling-vs-remote/ | 1533 | 54 | 130 |
| https://www.thehrstackguide.com/rippling-vs-remote-people/ | 1642 | 61 | 143 |
| https://www.thehrstackguide.com/terms/ | 449 | 37 | 140 |
| https://www.thehrstackguide.com/tools/eor-cost-calculator/ | 496 | 57 | 119 |
| https://www.thehrstackguide.com/workable-vs-bamboohr/ | 1388 | 56 | 135 |
| https://www.thehrstackguide.com/workable-vs-breezy-hr/ | 1416 | 54 | 139 |
| https://www.thehrstackguide.com/workable-vs-jazzhr/ | 1334 | 54 | 126 |
| https://www.thehrstackguide.com/workable-vs-recruitee/ | 1337 | 57 | 149 |

## Legacy sitemap file

`public/legacy-sitemap.xml` is copied into the build but is **not** listed in `sitemap-index.xml`. Leave it out of the primary sitemap. Submit it only as a one-off recrawl list for redirected URLs.

## Proposed batch fixes

No code changes required.
## How to re-run

```bash
npm run build
npm run audit:indexing
```
