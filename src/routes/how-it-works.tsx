import { createFileRoute } from '@tanstack/react-router';
import { SiteHeader, PageIntro, Steps, Closing, Footer } from '@/components/propertysetu/site';
import { metadata } from '@/lib/propertysetu';
export const Route=createFileRoute('/how-it-works')({head:()=>metadata('How to Find, Rent or List a Property','Search your city, connect with an owner, or list your home with PropertySetu.', '/how-it-works'),component:Page});
function Page(){return <><SiteHeader/><main><PageIntro eyebrow="From searching to settling" title="How to find or list a property with PropertySetu" description="Find a place you love, meet the people behind it, and take your next step with confidence."/><Steps/><Closing/></main><Footer/></>;}
