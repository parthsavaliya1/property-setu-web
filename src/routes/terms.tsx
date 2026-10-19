import { createFileRoute, Link } from '@tanstack/react-router';
import { SiteHeader, PageIntro, Footer } from '@/components/propertysetu/site';
import { metadata, SUPPORT_EMAIL } from '@/lib/propertysetu';
import { termsSections } from '@/lib/termsContent';

export const Route = createFileRoute('/terms')({
  head: () => metadata('Terms and community rules', 'Rules for property listings, conversations and safe use of PropertySetu.'),
  component: TermsPage,
});

function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageIntro eyebrow="Using PropertySetu" title="Terms and community rules" description="Updated 19 October 2026" />
        <article className="privacy site-width">
          {termsSections.map(([title, text]) => (
            <section key={title}><h2>{title}</h2><p>{text}</p></section>
          ))}
          <section>
            <h2>Privacy, deletion and support</h2>
            <p><Link to="/privacy">Read our Privacy Policy</Link></p>
            <p><Link to="/delete-account">Delete your account without installing the app</Link></p>
            <p>For support or moderation appeals, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
