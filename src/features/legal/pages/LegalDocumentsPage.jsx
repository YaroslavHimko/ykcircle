import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { openCookieSettings } from '@/shared/components/CookieSettings.jsx';
import SiteChrome from '@/shared/components/SiteChrome.jsx';
import { apiFetch } from '@/shared/api/client.js';
import { fallbackDocuments, available, asDocuments } from '../model/legal-documents.js';
import { MarkdownContent } from '../components/MarkdownContent.jsx';
export function LegalDocumentsPage({ documentSlug }) {
  const { slug: routeSlug } = useParams();
  const slug = documentSlug || routeSlug;
  const [documents, setDocuments] = useState(fallbackDocuments);
  const [document, setDocument] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    apiFetch('/api/legal-documents')
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => setDocuments(asDocuments(data)))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!slug) return;
    setDocument(null);
    setError('');
    if (!available(slug)) {
      setError('This document is not available during free early access.');
      return;
    }
    apiFetch(`/api/legal-documents/${encodeURIComponent(slug)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Legal document not found.');
        return data;
      })
      .then(setDocument)
      .catch((requestError) => setError(requestError.message));
  }, [slug]);
  return (
    <SiteChrome>
      <Helmet>
        {slug && !available(slug) && <meta name="robots" content="noindex" />}
        <title>{document?.title || (slug ? 'Legal document' : 'Legal documents')} | YKCircle</title>
      </Helmet>
      <section className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Legal</p>
        {slug === 'cookies' && (
          <button
            type="button"
            onClick={openCookieSettings}
            className="ui-action mt-5 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-medium hover:border-primary"
          >
            Manage cookie settings
          </button>
        )}
        {!slug ? (
          <>
            <h1 className="mt-3 font-display text-5xl font-black">Legal documents</h1>
            <p className="mt-5 max-w-2xl text-muted-foreground">
              Read YKCircle’s public policies, marketplace information, and terms.
            </p>
            <nav aria-label="Legal documents" className="mt-10 divide-y border-y border-border">
              {documents.map((item) => (
                <Link
                  key={item.slug}
                  to={`/${item.slug}`}
                  className="flex min-h-16 items-center justify-between gap-4 py-4 text-lg hover:text-primary"
                >
                  <span>{item.title}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </nav>
          </>
        ) : (
          <>
            {document && (
              <article>
                <h1 className="mt-3 font-display text-5xl font-black">{document.title}</h1>
                <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  <div>
                    <dt className="inline">Last updated: </dt>
                    <dd className="inline">{document.lastUpdated || 'Not stated'}</dd>
                  </div>
                  <div>
                    <dt className="inline">Current version: </dt>
                    <dd className="inline">{document.version}</dd>
                  </div>
                </dl>
                <MarkdownContent content={document.content} />
              </article>
            )}
            {error && (
              <p role="alert" className="mt-6 text-destructive">
                {error}
              </p>
            )}
            {!document && !error && <p className="mt-8 text-muted-foreground">Loading document…</p>}
            <Link to="/legal" className="mt-12 inline-block text-sm text-primary underline">
              Back to legal documents
            </Link>
          </>
        )}
      </section>
    </SiteChrome>
  );
}
export default LegalDocumentsPage;
