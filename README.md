# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## VPS deployment

`npm run build` explicitly targets Nitro's Node server preset for the PM2/Nginx
deployment. The Lovable configuration otherwise defaults to Cloudflare output,
which does not open an HTTP port when started with Node and causes Nginx 502s.
Use `npm run build:cloudflare` only for Cloudflare hosting.

On the VPS, update with just:

```sh
git pull --ff-only
npm run build
```

After a successful Node build, npm's `postbuild` script restarts the matching
`property-setu-web` PM2 app with port 3005 and checks its HTTP response. It skips
restarting on local/Lovable builds without a matching PM2 app in this checkout.
A failed build does not run the restart. A failed restart or health check exits
with an error so the deployment failure is visible.


## Property explorer

The original marketing homepage remains at `/`. Use **Explore properties** in its desktop navigation or mobile menu to open `/explore`.

The explorer is a browser client for the existing PropertySetu backend. Its screens use shareable query parameters, for example `/explore?view=wallet` and `/explore?view=details&id=PROPERTY_ID_OR_SLUG`. Browser back/forward navigation works between screens.

Implemented workflows include OTP sign-in and registration, browsing and filters, saved properties and searches, property details and map locations, inquiries and visits, chat with attachments/replies/reactions, notifications, profile editing, account deletion, blocking/reporting, and property creation/editing with photos/video/documents and poster extraction. Listing publication supports the existing free trial, monthly/yearly regular and premium plans, wallet charges, and Razorpay wallet top-ups.

Product authentication uses `propertysetu_web_session`, independently of the administrator session. Protected screens require sign-in. Records, balances, pricing, and free-listing eligibility come from the API. Wallet credits are displayed after server verification; a payment whose verification fails is retained for verification retry rather than initiating a second charge.

On local hosts the existing API client connects to port 4000 on the same machine. Hosted builds use `VITE_API_URL` or the existing backend fallback. Uploads allow extra time for the backend's image/video processing. Payment, OTP, and media services must be configured on that backend.

The mobile layout uses app-style tabs and stack screens; property details have fixed contact actions. Larger screens use a grouped account dropdown in the header, full-width page content, wider forms, listing grids, and side-by-side detail/contact panels. The account dropdown follows the VADI Portal shop pattern and includes every explorer menu destination; there is no persistent sidebar.

Loading uses the VADI app's rotating ring and breathing logo animation with PropertySetu branding and reduced-motion support. My properties shows one listing loader; statistics load independently without blocking the listings.

Listing payments follow the native app: the first eligible regular monthly listing receives the free trial, active listings retain their plan and expiry when edited, and expired listings pay the selected term's renewal price. The backend determines the calendar-month/year expiry. Publishing can top up only the wallet shortfall and retry an unverified payment without creating another checkout order.

`npm run test` covers authentication isolation, session expiry, filters, wallet verification recovery, publishing recovery, chat entry, unavailable listings, pagination, plan pricing, and route separation. Checkout tests use a mocked provider; automated tests do not charge a card, send an OTP, or publish a real property.

## Search engine optimization

Production SEO targets `https://propertysetu.co.in`. `src/lib/seo.ts` supplies
page titles, descriptions, absolute canonical links, Open Graph/Twitter cards,
and Organization, WebSite, WebPage and breadcrumb JSON-LD. Keep its `SITE_URL`,
`PUBLIC_PATHS`, `public/sitemap.xml` and the sitemap line in `public/robots.txt`
in sync when changing the domain or public routes. Sitemap dates are omitted
rather than publishing inaccurate modification dates.

Public marketing, legal and default explorer pages are indexable. The explorer
canonical uses `/explore?view=home` because the router redirects bare `/explore`
to that URL. Admin pages,
private explorer workflows, property detail query states, filtered search results
and error responses receive `noindex`; the server also sends `X-Robots-Tag` so
client-rendered admin HTML is covered. Robots permits crawling to let engines
read these directives. This does not replace authentication.

Property records currently load from the browser API. Individual property detail
states are deliberately excluded until there are dedicated public pages with
server-rendered listing content, unique metadata, and correct unavailable-listing
HTTP responses. Do not add these query states to the sitemap as if they were
fully crawlable listing pages.

After deploying through the existing VPS workflow, verify the domain in Google
Search Console and submit `https://propertysetu.co.in/sitemap.xml`. Inspect the
homepage and public URLs using URL Inspection and monitor indexing and search
queries. DNS/HTML verification requires the domain owner's account; it is not
automatically completed by this code change. First-place rankings cannot be
guaranteed by implementation changes.

Explorer screens use distinct titles and descriptions from `explorerMetadata` in
`src/lib/seo.ts`, sharing indexing rules with the server response headers. Keep
new explorer views covered by `src/test/seo.test.ts`. Public marketing headings
and footer links describe and connect the searchable pages.

To check rendered SEO after a build, start the Node output and run:

```sh
node .output/server/index.mjs
# In a second terminal (use the actual local port):
node scripts/check-seo.mjs http://localhost:3000
```

The check reads the deployed sitemap and validates each public page's HTTP status,
unique title, description, canonical, robots directives and JSON-LD, plus private
page/error indexing headers and social assets. It can also target the production
origin after deployment.
