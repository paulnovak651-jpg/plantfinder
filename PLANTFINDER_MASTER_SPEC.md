# PLANTFINDER — V1 MASTER SPEC

> Single source of truth for the PlantFinder MVP.
> Every agent (human or AI) references this document before writing code.

---

## 1. Product Definition

**PlantFinder** is a plant nursery aggregation platform where people search for edible plants (fruit trees, nut trees, berry bushes, rootstocks, scionwood) and find nurseries that sell them.

**Core value proposition:** One search box → ranked results across multiple nurseries, with availability, pricing, and shipping info.

**Target users:** Home orchardists, permaculture practitioners, small-scale farmers, and plant hobbyists looking for specific cultivars.

---

## 2. Principles

1. **Search-first** — every interaction starts from the search bar.
2. **Data quality over quantity** — a small, accurate catalog beats a large, stale one.
3. **Nursery-friendly** — nurseries opt in; we never scrape without permission.
4. **Transparent ranking** — users can understand why results are ordered the way they are.
5. **Progressive enhancement** — ship a working core, then layer on features.

---

## 3. User Types

| Role | Description |
|------|------------|
| **Searcher** | Anonymous visitor who searches for plants. No account required for V1. |
| **Admin** | Project maintainer who imports nursery data via CSV and manages listings. |
| **Nursery** | (Future) Nursery owner who manages their own listings. Not in V1 scope. |

---

## 4. User Flows

### 4a. Search Flow (Searcher)
1. Land on homepage → see search bar prominently displayed
2. Type query (e.g., "pawpaw tree", "Honeycrisp apple rootstock", "hazelnut Minnesota")
3. View ranked results showing: plant name, cultivar, nursery name, price, availability status, shipping info
4. (Future) Click result → nursery detail page

### 4b. Admin Import Flow
1. Admin prepares CSV with nursery inventory data
2. Upload CSV via admin interface
3. System validates, deduplicates, and imports into database
4. New listings appear in search results

---

## 5. Information Architecture

```
/                     → Homepage with search bar
/search?q=...&zip=... → Search results page
/api/search           → Search API endpoint
/admin/import         → (Future) CSV import interface
/nursery/:id          → (Future) Nursery detail page
```

---

## 6. Data Model

### Core Tables (Supabase/Postgres)

**nurseries**
- id, name, slug, website, email, phone
- address, city, state, zip, lat, lng
- ships_to (array of state codes)
- description, logo_url
- verified (boolean), active (boolean)
- created_at, updated_at

**plants**
- id, common_name, scientific_name, category
- use_tags (array: e.g., "fruit", "nut", "rootstock", "scionwood")
- description
- created_at, updated_at

**inventory_listings**
- id, nursery_id (FK → nurseries), plant_id (FK → plants)
- cultivar_name, rootstock_name
- price_cents, price_label
- in_stock (boolean), availability_note
- size_label, form_label (e.g., "bare root", "potted")
- listing_url (deep link to nursery's product page)
- confidence_score (0.0–1.0, data quality indicator)
- last_verified_at
- created_at, updated_at

**inventory_import_batches**
- id, nursery_id, filename, row_count
- status (pending, processing, complete, failed)
- error_log (jsonb)
- imported_by, created_at

**plant_aliases**
- id, plant_id (FK → plants), alias (text)
- Used for synonym matching in search (e.g., "paw paw" = "pawpaw" = "Asimina triloba")

**zip_zones**
- zip, state, lat, lng, usda_zone
- Used for location-based search and zone filtering

**user_searches**
- id, query, zip, results_count, created_at
- Analytics table for tracking search patterns

---

## 7. Search Behavior

### Query Parsing
The `parseQuery()` function in `src/lib/search.ts` handles:
- **Stop word removal**: filters common words ("the", "a", "for", "in", etc.)
- **Listing type detection**: identifies keywords like "rootstock", "scionwood", "bare root"
- **Use tag extraction**: maps terms to plant categories
- **State code detection**: extracts 2-letter state abbreviations (known issue: false matches on "in", "to", "me")
- **Plant terms**: remaining tokens used for text matching

### Ranking Algorithm (Composite Score)
| Factor | Weight | Description |
|--------|--------|------------|
| Text match | 35% | How well plant terms match listing fields (common_name, cultivar, scientific_name) |
| Availability | 25% | In-stock items ranked higher |
| Confidence | 20% | Data quality/freshness score |
| Distance | 10% | Haversine distance from user ZIP (if provided) |
| Shipping | 10% | Whether nursery ships to user's state |

### Known Issues
- State parsing treats any 2-letter token as a state code (e.g., "in", "to", "me" get interpreted as IN, TO, ME)
- Empty query shows loading state instead of helpful empty state
- No result limiting strategy (all matches returned)

---

## 8. Import Pipeline

### V1 (Admin CSV Import)
1. Admin prepares CSV with columns: nursery_name, plant_common_name, cultivar, rootstock, price, in_stock, size, form, url
2. System creates `inventory_import_batch` record
3. Rows are validated (required fields, data types, URL format)
4. Plants are matched or created (fuzzy matching on common_name + aliases)
5. Nursery is matched or created (by name + state)
6. Listings are upserted (matched on nursery_id + plant_id + cultivar + rootstock)
7. Batch status updated; errors logged to `error_log` jsonb field

### Future: Nursery Self-Service
- Nursery owners get accounts and can upload their own CSVs or manage listings via UI
- API integration for automated inventory syncing

---

## 9. UI/UX Rules

1. **Dark theme by default** (bg-gray-950, text-white) — already implemented
2. **Search bar is always visible** at the top of every page
3. **Results show key info at a glance**: plant name, cultivar, nursery, price, stock status
4. **Mobile-first responsive design** using Tailwind CSS
5. **No authentication required** for searching in V1
6. **Loading states**: Skeleton loaders for search results
7. **Error states**: User-friendly messages, never raw error dumps
8. **Accessibility**: Semantic HTML, proper ARIA labels, keyboard navigation

---

## 10. Technical Foundation

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15+ (App Router, TypeScript, Turbopack) |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) with Row Level Security |
| Hosting | Vercel (auto-deploys on push to main) |
| Auth | Supabase Auth (future, not V1) |
| Maps | (Future) Leaflet or Mapbox for nursery locations |
| IDE | code-server (VS Code in browser) on WSL2 |
| Repo | github.com/paulnovak651-jpg/plantfinder |

### Key Files
```
src/lib/db.ts           → Supabase client (anon + admin)
src/lib/search.ts       → Search engine (parseQuery, searchListings, textMatch, haversine)
src/lib/seed.ts         → Database seeder (10 plants, 9 cultivars, 7 rootstocks, 10 suppliers, 18 listings, 20 zip zones)
src/app/api/search/route.ts → GET /api/search?q=...&zip=...
src/app/search/page.tsx  → Search results page (with Suspense boundary)
```

---

## 11. Metrics (V1)

| Metric | Target | How Measured |
|--------|--------|-------------|
| Search latency | < 500ms p95 | Vercel analytics |
| Results relevance | Top 3 results match intent | Manual QA |
| Uptime | 99.5% | Vercel status |
| Search volume | Track queries | user_searches table |
| Zero-result rate | < 20% | user_searches where results_count = 0 |

---

## 12. Scope Freeze (V1)

### In Scope
- [x] Search by plant name, cultivar, type
- [x] Search results with ranking
- [x] ZIP code for distance/zone filtering
- [x] Database seeding with test data
- [x] Vercel deployment
- [ ] Admin CSV import
- [ ] Nursery detail pages
- [ ] Basic search analytics dashboard

### Out of Scope (V2+)
- User accounts / authentication
- Nursery self-service portal
- Shopping cart / price comparison
- Reviews and ratings
- Notifications (back-in-stock alerts)
- Mobile app
- Payment processing
- Advanced filtering (price range, zone, ship-to-state)

---

## 13. Current Sprint

### Completed
- [x] Supabase schema deployed (all tables created)
- [x] Search engine implemented (parseQuery + searchListings + composite ranking)
- [x] API endpoint working (GET /api/search)
- [x] Search UI page with results display
- [x] Database seeded with test data
- [x] Deployed to Vercel (plantfinder-cyan.vercel.app)
- [x] TypeScript build errors fixed (.catch → .then rejection handler)
- [x] Suspense boundary added for Next.js 16 compatibility

### In Progress / Blockers
- [ ] CRITICAL: Rotate Supabase service role key — it's hardcoded in seed.ts and committed to source control
- [ ] Fix state parsing false matches (2-letter words like "in", "to")
- [ ] Fix empty-query loading state bug on /search
- [ ] Fix lint-blocking issues (any usage, a href navigation)

### Up Next
- [ ] Build admin CSV import workflow
- [ ] Build nursery detail pages (/nursery/:id)
- [ ] Implement search result limiting
- [ ] Wire up user location to SearchMap component
- [ ] Update README from template to project-specific docs

---

## 14. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-02 | Supabase over SQLite | Need hosted DB for Vercel serverless deployment; Supabase provides Postgres + auth + RLS |
| 2025-02 | Vercel for hosting | Zero-config Next.js deployment, auto-deploys on push, generous free tier |
| 2025-02 | Composite ranking over simple text match | Multiple factors (availability, distance, confidence) matter beyond keyword matching |
| 2025-02 | No auth for V1 searchers | Reduce friction; anyone should be able to search without creating an account |
| 2025-02 | Dark theme default | Target audience skews technical; dark theme is preferred and easier on eyes |
| 2025-02 | Client-side text matching | Supabase free tier has limited full-text search; client-side gives more control over ranking |
| 2025-02 | Hardcoded seed data | Speed of iteration for MVP; will be replaced by CSV import pipeline |

---

*Last updated: February 2025*
*Generated by ChatGPT, updated by Claude — committed to repo as single source of truth*
