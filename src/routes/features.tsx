import { createFileRoute } from '@tanstack/react-router';
import { SiteHeader, PageIntro, Features, Closing, Footer } from '@/components/propertysetu/site';
import { metadata } from '@/lib/propertysetu';
export const Route=createFileRoute('/features')({head:()=>metadata('Features','Explore maps, favourites, direct chat, visits, listing plans, and more on PropertySetu.'),component:Page});
function Page(){return <><SiteHeader/><main><PageIntro eyebrow="Thoughtfully connected" title="Every detail. One place." description="From the first search to the first visit, everything you need for your next move."/><Features/><Closing/></main><Footer/></>;}
