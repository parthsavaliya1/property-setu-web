import { createFileRoute } from '@tanstack/react-router';
import { SiteHeader, PageIntro, Listings, Closing, Footer } from '@/components/propertysetu/site';
import { metadata } from '@/lib/propertysetu';
export const Route=createFileRoute('/listings')({head:()=>metadata('Properties for Sale, Rent, Lease & PG in India','Browse the latest homes for sale, rent, lease, and PG on PropertySetu.', '/listings'),component:Page});
function Page(){return <><SiteHeader/><main><PageIntro eyebrow="A place to belong" title="Properties for sale, rent, lease and PG in India" description="Discover places for sale, rent, lease, and PG. Your next chapter could be just around the corner."/><Listings/><Closing/></main><Footer/></>;}
