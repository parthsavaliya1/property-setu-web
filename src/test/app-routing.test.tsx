import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
  it("keeps the app-style explorer separate from the original home and listings pages", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const home = router.matchRoutes("/").at(-1);
    const listings = router.matchRoutes("/listings").at(-1);
    const explorer = router.matchRoutes("/explore").at(-1);

    expect(home?.routeId).toBe("/");
    expect(listings?.routeId).toBe("/listings");
    expect(explorer?.routeId).toBe("/explore");
  });
});
