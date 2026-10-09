import { createFileRoute } from '@tanstack/react-router';
import { SiteHeader, PageIntro, Steps, Closing, Footer } from '@/components/propertysetu/site';
import { metadata } from '@/lib/propertysetu';
export const Route=createFileRoute('/how-it-works')({head:()=>metadata('How it works','Search your city, connect with an owner, or list your home with PropertySetu.'),component:Page});
function Page(){return <><SiteHeader/><main><PageIntro eyebrow="From searching to settling" title="A simpler way home." description="Find a place you love, meet the people behind it, and take your next step with confidence."/><Steps/><Closing/></main><Footer/></>;}
