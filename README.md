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
