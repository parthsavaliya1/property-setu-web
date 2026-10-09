<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## PropertySetu architecture
- Keep marketing and admin in TanStack file-based routes; the separate product app is linked externally because this site does not own its workflows.
- Keep shared marketing presentation and admin presentation in separate modules; admin session state is scoped to the admin parent so it persists across admin pages.
- Access the existing API through the browser-only configurable VITE_API_URL client, with no new server or database, because this project supplies only the website UI for an existing service.
- Show live API records or explicit loading/empty/error states, never fabricated marketplace or administrator records.

- Keep the public admin layout preview separate from authenticated admin modules; it uses no session, API calls, private records, or mutation controls so preview access cannot bypass authentication.
