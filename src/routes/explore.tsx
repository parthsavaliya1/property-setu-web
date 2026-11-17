import { createFileRoute } from "@tanstack/react-router";
import { ExplorerApp } from "@/components/propertysetu/explorer/app";
import { parseExplorerSearch } from "@/lib/explorer";
import { explorerMetadata } from "@/lib/seo";
export const Route = createFileRoute("/explore")({
  validateSearch: parseExplorerSearch,
  head: ({ match }) => explorerMetadata(match.search),
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
