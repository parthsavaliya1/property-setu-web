import { createFileRoute } from "@tanstack/react-router";
import { ExplorerApp } from "@/components/propertysetu/explorer/app";
import { parseExplorerSearch } from "@/lib/explorer";
import { metadata } from "@/lib/propertysetu";
export const Route = createFileRoute("/explore")({
  validateSearch: parseExplorerSearch,
  head: () =>
    metadata(
      "Explore properties",
      "Search properties, connect with owners, manage listings, and access your PropertySetu wallet.",
    ),
  component: Page,
});
function Page() {
  const location = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ExplorerApp
      location={location}
      navigate={(next) => {
        void navigate({ search: next });
        window.scrollTo({ top: 0 });
      }}
    />
  );
}
