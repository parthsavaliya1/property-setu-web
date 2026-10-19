import { createFileRoute, Link } from '@tanstack/react-router';
import { SiteHeader, PageIntro, Footer } from '@/components/propertysetu/site';
import { metadata, API_URL } from '@/lib/propertysetu';
import { privacySections } from '@/lib/privacyContent';
export const Route = createFileRoute('/privacy')({ head: () => metadata('Privacy policy', 'How PropertySetu processes your information.'), component: Page });
function Page() { return <><SiteHeader/><main><PageIntro eyebrow="Your trust matters" title="Privacy policy" description="Updated 19 October 2026"/><article className="privacy site-width">{privacySections.map(([title, text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}<section><h2>Contact and deletion</h2><p><a href={API_URL + '/privacy'}>Current support contact and public policy</a></p><p><Link to="/delete-account">Delete your account without installing the app</Link></p><p><Link to="/terms">Terms and community rules</Link></p></section></article></main><Footer/></>; }
