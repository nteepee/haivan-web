# Route landing pages: reference seed

Editorial content extracted from Hải Vân's own ad landing pages on booking.haivan.com. Used as reference for the haivan.com rebuild.

- Source: https://booking.haivan.com (vi and /en/), read-only GET, no login, no POST
- Fetched: 2026-10-28 (stamp 261028)
- Parser: html.parser (stdlib), whitespace normalized, Vietnamese text kept as-is
- Files: one JSON per page, named `<slug>.json`. English pages are prefixed `en-`.

## Page to route mapping

Public path pattern: vi `/xe-khach/{slug}`, en `/en/xe-khach/{slug}`. Slugs come from `apps/booking/src/content/popular-routes.json` and `layout-fallback.json`.

| JSON file | Source URL (booking.haivan.com) | Route slug |
|---|---|---|
| mua-ve-xe-sai-gon-vung-tau.json | /mua-ve-xe-sai-gon-vung-tau/ | `quan-1/vung-tau` |
| en-ho-chi-minh-city-to-vung-tau-bus.json | /en/ho-chi-minh-city-to-vung-tau-bus/ | `quan-1/vung-tau` |
| mua-ve-xe-vung-tau-sai-gon.json | /mua-ve-xe-vung-tau-sai-gon/ | `vung-tau/quan-1-san-bay` |
| en-vung-tau-to-ho-chi-minh-city-bus.json | /en/vung-tau-to-ho-chi-minh-city-bus/ | `vung-tau/quan-1-san-bay` |
| mua-ve-xe-ha-noi-dien-bien.json | /mua-ve-xe-ha-noi-dien-bien/ | `my-dinh/dien-bien` |
| en-hanoi-to-dien-bien-bus.json | /en/hanoi-to-dien-bien-bus/ | `my-dinh/dien-bien` |
| mua-ve-xe-dien-bien-ha-noi.json | /mua-ve-xe-dien-bien-ha-noi/ | unmapped (reverse not in popular routes) |
| en-dien-bien-to-hanoi-bus.json | /en/dien-bien-to-hanoi-bus/ | unmapped (reverse not in popular routes) |
| mua-ve-xe-khu-hoi-dien-bien-ha-noi.json | /mua-ve-xe-khu-hoi-dien-bien-ha-noi/ | unmapped (no route slug yet, round trip) |
| en-dien-bien-hanoi-round-trip-bus.json | /en/dien-bien-hanoi-round-trip-bus/ | unmapped (no route slug yet, round trip) |
| mua-ve-xe-ha-noi-moc-chau.json | /mua-ve-xe-ha-noi-moc-chau/ | unmapped (Mộc Châu has no route slug yet) |
| mua-ve-xe-moc-chau-ha-noi.json | /mua-ve-xe-moc-chau-ha-noi/ | unmapped (Mộc Châu has no route slug yet) |
| mua-ve-xe-ha-noi-son-la.json | /mua-ve-xe-ha-noi-son-la/ | `my-dinh/son-la` |
| mua-ve-xe-son-la-ha-noi.json | /mua-ve-xe-son-la-ha-noi/ | unmapped (reverse not in popular routes) |

Notes:
- `tan-son-nhat/vung-tau` also exists in popular routes as a separate airport route. The Vũng Tàu to Sài Gòn page maps to `vung-tau/quan-1-san-bay` per the brief. Confirm this choice.
- `yen-nghia/dien-bien` is a different origin (Yên Nghĩa), not the Hà Nội page.
- No en page was fetched for Sơn La (`/en/hanoi-to-son-la-bus/` is linked from the page but was not in the brief).

## Common section pattern

Pages share one template (`template-route-booking`). Order of blocks:

1. Hero: `p.hvr-kicker` eyebrow, `h1`, `hero_sub`, `stats` (`ul.hvr-intro-stats`).
2. Offer block (optional): on Sài Gòn–Vũng Tàu pages the combo promo is in the booking console and is stored in `promo`. On Điện Biên pages offers are regular sections.
3. Brand intro: h2 plus intro paragraphs.
4. Why / benefits: h3 cards (`li.hvr-why-card` or `article`).
5. Vehicles: h3 per vehicle with price (`strong`) and bullets.
6. Amenities: h3 per amenity.
7. Offices / stops: h3 per office (`article.hvr-office-card`) with `address`, `hours` and text. Stop addresses are bullets.
8. Reviews: `li.hvr-quote` cards, stored in top-level `reviews`.
9. CTA and app download.
10. FAQ: `section.hvr-faq`, `details`/`summary` items, stored in `faq` and `faq_section`. Matches FAQPage JSON-LD on all 14 pages.

Skipped by design:
- `section.hvr-schedule` (live trip list): heading and eyebrow only, marked `skipped`.
- `section.hvrt-workspace` (booking widget): omitted.
- `section.hvr-hero` (booking console): omitted, except the combo promo copy stored in `promo`.

Field notes:
- `intro` and item `text` are paragraphs joined with `\n`.
- `extra` lists paragraphs in a section that did not fit intro or items. Present on Điện Biên, Mộc Châu and Sơn La pages.
- `items[].eyebrow` is the item kicker, present only when the page has one.
- Office cards add `address` and `hours` (dict).
- `images` excludes SVGs, icons and widget images. `internal_links` covers all booking.haivan.com links on the page, including the shared nav.

## Counts

Per page: content sections (heading-only schedule counted separately), FAQ items (matches JSON-LD), reviews, and promo presence.

| File | Sections | Content sections | FAQ | Reviews | Promo |
|---|---|---|---|---|---|
| mua-ve-xe-sai-gon-vung-tau.json | 10 | 9 | 16 | 5 | yes |
| mua-ve-xe-vung-tau-sai-gon.json | 10 | 9 | 17 | 5 | yes |
| mua-ve-xe-ha-noi-dien-bien.json | 11 | 10 | 15 | 0 | no |
| mua-ve-xe-dien-bien-ha-noi.json | 11 | 10 | 15 | 0 | no |
| mua-ve-xe-khu-hoi-dien-bien-ha-noi.json | 7 | 7 | 12 | 0 | no |
| mua-ve-xe-ha-noi-moc-chau.json | 10 | 9 | 15 | 0 | no |
| mua-ve-xe-moc-chau-ha-noi.json | 10 | 9 | 15 | 0 | no |
| mua-ve-xe-ha-noi-son-la.json | 9 | 8 | 11 | 0 | no |
| mua-ve-xe-son-la-ha-noi.json | 9 | 8 | 11 | 0 | no |
| en-ho-chi-minh-city-to-vung-tau-bus.json | 10 | 9 | 16 | 5 | yes |
| en-vung-tau-to-ho-chi-minh-city-bus.json | 10 | 9 | 17 | 5 | yes |
| en-hanoi-to-dien-bien-bus.json | 11 | 10 | 15 | 0 | no |
| en-dien-bien-to-hanoi-bus.json | 11 | 10 | 15 | 0 | no |
| en-dien-bien-hanoi-round-trip-bus.json | 7 | 7 | 12 | 0 | no |

Parse failures: none. All 14 pages returned HTTP 200 and parsed.
