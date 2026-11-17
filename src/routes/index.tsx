import { createFileRoute } from "@tanstack/react-router";
import {
  SiteHeader,
  Hero,
  Steps,
  Features,
  Listings,
  Closing,
  Footer,
} from "@/components/propertysetu/site";
import { Journey, WaysToLive, Questions } from "@/components/propertysetu/discover";
import { metadata } from "@/lib/propertysetu";
import { PropertySearches } from "@/components/propertysetu/property-searches";
export const Route = createFileRoute("/")({
  head: () =>
    metadata(
      "Buy, Rent & List Properties in India",
      "Search flats, houses, plots and commercial properties in India. Find homes for sale, rent, lease and PG accommodation, or list your property on PropertySetu.",
      "/",
    ),
  component: Index,
});
function Index() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <WaysToLive />
        <Steps />
        <Journey />
        <Features />
        <Listings home />
        <PropertySearches />
        <Questions />
        <Closing />
      </main>
      <Footer />
    </>
  );
}
