import { usePagedResource } from "./paging";
import { useState } from "react";
import { MapPin } from "lucide-react";
import type { PropertyCard } from "@/lib/explorer-types";
import { useProduct, useResource } from "./context";
import { ExploreLink, LoadMore, PageHeading, RemoteState } from "./ui";
import { displayPrice } from "@/lib/propertysetu";
export function MapPage() {
  const app = useProduct();
  const list = usePagedResource<PropertyCard>("/properties", app.token);
  const [selected, setSelected] = useState("");
  const pins =
    list.data?.filter(
      (row) =>
        row.latitude != null &&
        row.longitude != null &&
        Number.isFinite(Number(row.latitude)) &&
        Number.isFinite(Number(row.longitude)),
    ) || [];
  const current = pins.find((row) => row.id === selected) || pins[0];
  const lat = Number(current?.latitude);
  const lng = Number(current?.longitude);
  return (
    <div className="xp-page">
      <PageHeading
        title="Find your place on the map"
        description="Explore the locations of available properties."
      />
      <RemoteState {...list} empty={!pins.length} emptyText="No properties with map locations yet">
        {current && (
          <div className="xp-map-layout">
            <div className="xp-map-results">
              {pins.map((row) => (
                <button
                  className={current.id === row.id ? "active" : ""}
                  key={row.id}
                  onClick={() => setSelected(row.id)}
                >
                  {row.cover_image && <img src={row.cover_image} alt="" />}
                  <div>
                    <strong>{row.title}</strong>
                    <span>{displayPrice(row.price)}</span>
                    <small>{[row.locality, row.city].filter(Boolean).join(", ")}</small>
                  </div>
                </button>
              ))}
            </div>
            <div className="xp-map-frame">
              <iframe
                title={`Location of ${current.title}`}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.025},${lat - 0.018},${lng + 0.025},${lat + 0.018}&layer=mapnik&marker=${lat},${lng}`}
              />
              <ExploreLink className="xp-button" view="details" id={current.slug || current.id}>
                <MapPin size={17} />
                View {current.title}
              </ExploreLink>
            </div>
          </div>
        )}
      </RemoteState>
      <LoadMore resource={list} />
    </div>
  );
}
