import { createFileRoute } from '@tanstack/react-router';
import { SiteHeader, Hero, Steps, Features, Listings, Closing, Footer } from '@/components/propertysetu/site';
import { Journey, WaysToLive, Questions } from '@/components/propertysetu/discover';
import { metadata } from '@/lib/propertysetu';
export const Route=createFileRoute('/')({head:()=>metadata('Find a home. Make it yours.', 'Find, buy, rent, and list homes in India. Search your city, connect with owners, and discover your next address.'),component:Index});
function Index(){return <><SiteHeader/><main><Hero/><WaysToLive/><Steps/><Journey/><Features/><Listings home/><Questions/><Closing/></main><Footer/></>;}
