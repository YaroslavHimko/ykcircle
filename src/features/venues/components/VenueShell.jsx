import { Helmet } from 'react-helmet';
import SiteChrome from '@/shared/components/SiteChrome.jsx';
export function Shell({ title, description, children, noindex = false, directory = false }) {
  return (
    <SiteChrome>
      <Helmet>
        <title>{title} | YKCircle</title>
        {description && <meta name="description" content={description} />}
        {noindex && <meta name="robots" content="noindex" />}
      </Helmet>
      <section className={directory ? 'directory-page' : 'page-container'}>{children}</section>
    </SiteChrome>
  );
}
export function ErrorState({ error, retry }) {
  return (
    <div
      role="alert"
      className="rounded-2xl mt-8 border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive"
    >
      <p>{error}</p>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="ui-action mt-3 border border-destructive/40 px-3 py-2 text-foreground"
        >
          Try again
        </button>
      )}
    </div>
  );
}
