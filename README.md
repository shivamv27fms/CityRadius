# CityRadius

CityRadius is a Delhi NCR place-discovery and community-review website inspired by the directory concept of Nearquad, rebuilt as an original product. It combines researched local context with live Google Maps/Places facts while keeping those two signals visibly separate.

## What is included

- All 30 cafés from `data/delhi_ncr_cafe_data.csv`, including work, food, budget, noise, socket and evidence fields.
- 10 additional verified starting points across libraries, coworking spaces and bookstores.
- Live Google Places discovery for cafés, PGs/hostels, libraries, coworking, bookstores, printing, fitness and pharmacies.
- Google Maps, current addresses, photos with attribution, ratings, opening hours, phone, website and directions.
- Search, city/category filters, café-specific filters, sorting, map/list views and three-place comparison.
- Passwordless email sign-in, member profiles and avatar uploads.
- One editable rating/review per user and place, plus moderated community photo uploads.
- Saved places, place suggestions and a moderator/admin dashboard.
- A responsive static frontend that can be uploaded to Hostinger, GoDaddy, cPanel hosting, Netlify or Vercel.

## Architecture

The React/Vite frontend is static and portable. Supabase provides authentication, PostgreSQL, row-level security and file storage. Google Maps JavaScript API and Places API (New) provide live place content in the browser.

Google place facts and photos are requested live and held only in memory. CityRadius stores stable Google Place IDs when a member reviews or saves a live result; it does not copy Google photos into its database. Community photos are stored separately in Supabase Storage.

## Database

Apply `supabase/migrations/202608200001_cityradius.sql`, then `supabase/seed.sql`.

| Data | Storage |
| --- | --- |
| Login email and session | Supabase `auth.users` (not exposed through public profiles) |
| Display name, avatar, role, home city | `profiles` |
| CSV, curated and Google place references | `places` |
| Member ratings and reviews | `reviews` |
| User-uploaded review photos and moderation state | `review_photos` + `review-photos` bucket |
| Profile photos | `avatars` bucket |
| Shortlists | `favorites` |
| Suggested places | `place_submissions` |
| Abuse/inaccuracy reports and audit entries | `reports`, `moderation_actions` |

Row-level security limits account changes, reviews, photos and saved places to the correct user. Moderator actions require a `moderator` or `admin` role. Public profile rows contain no email column.

## Configure safely

1. The frontend is already pointed at `https://qxijwufsxfnhkeaamflo.supabase.co` with its browser-safe publishable key. Run the migration and seed in that project's SQL editor.
2. In Supabase Auth, set the production Site URL to `https://www.cityradius.in` and allow `https://www.cityradius.in/auth/callback` as a redirect URL. Configure production SMTP before a public launch so magic-link delivery is reliable.
3. For local or build-platform deployment, copy `.env.example` to `.env.local`; it already contains the Supabase project URL and publishable key. For plain shared hosting, the same values are already present in `cityradius-config.js`.
4. In Google Cloud, restrict the browser key to `https://cityradius.in/*`, `https://www.cityradius.in/*` and localhost only while developing. Restrict API access to Maps JavaScript API and Places API (New), and confirm billing is active. The current key is already wired into `.env.example` and `cityradius-config.js`.

Do not use a Google service-account key or a Supabase service-role key in this frontend. Because the original browser key was shared in chat, restrict it before use; rotating it is the safest option.

To make the first admin after that person has signed in once:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'owner@example.com');
```

## Develop and validate

Requires a current Node.js LTS release.

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
```

The two PowerShell scripts in `scripts/` make the café data reproducible: one converts the source CSV into the typed frontend JSON, and the other generates the repeatable Supabase seed.

## Deploy to Hostinger or GoDaddy

1. Upload the **contents** of the shared-hosting package to the domain's `public_html` or document-root directory.
2. The restricted Google browser key, Supabase project URL and Supabase publishable key are already present in `cityradius-config.js`. Update them only if a key or project changes. No build tools are required on the host.
3. Keep the included `.htaccess`; it sends direct links such as `/places/roastery-coffee-house` back to the single-page app.
4. Use HTTPS and add the final production and `www` domains to both Google key restrictions and Supabase redirect URLs.
5. Replace the relative Open Graph image URL in `index.html` with the final absolute domain URL if a social platform does not resolve it automatically.

For a subdirectory deployment rather than a domain root, set Vite's `base` and React Router basename to that subdirectory before building.

## Deploy to Vercel

Import the repository, add the three `VITE_` environment values in project settings and deploy. `vercel.json` supplies the single-page-app rewrite.

The production domain uses `https://www.cityradius.in` as its canonical URL and redirects the apex domain there. Each build generates `sitemap.xml`; after deployment, submit `https://www.cityradius.in/sitemap.xml` in Google Search Console and request indexing for the homepage, Explore page and representative place pages.

## Production notes

- Review text publishes immediately; uploaded review photos start as `pending` and require moderator approval.
- The local no-Supabase mode is deliberately a device-only preview. It is useful for presentation, but it is not a substitute for real email verification or shared persistence.
- Live Google content depends on API quota, billing and key restrictions. The interface remains usable with curated data when Google is unavailable.
- Add rate limiting or CAPTCHA to Supabase authentication and submissions before a high-traffic public launch.
- The share-card asset at `public/og.png` was generated with the built-in image tool from this brief: an editorial Delhi NCR city-grid collage in CityRadius's ivory, ink, green and orange palette, with the exact text “CityRadius” and “Find your place in Delhi NCR.”
