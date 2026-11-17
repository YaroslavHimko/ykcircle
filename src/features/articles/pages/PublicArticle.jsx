import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SiteChrome from '@/shared/components/SiteChrome.jsx';
import ArticleContent from '../components/ArticleContent.jsx';
import { articleDate, articleImageUrl, articleRequest } from '../api/articles.js';
export function PublicArticle() {
  const { slug } = useParams();
  const token = localStorage.getItem('authToken');
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    articleRequest(`/api/articles/${encodeURIComponent(slug)}`, {
      token,
    })
      .then((item) => {
        if (live) setArticle(item);
      })
      .catch((requestError) => {
        if (live) setError(requestError.message);
      });
    return () => {
      live = false;
    };
  }, [slug, token]);
  if (error)
    return (
      <SiteChrome>
        <section className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
          <Link to="/articles" className="text-sm text-primary">
            ← All articles
          </Link>
          <h1 className="mt-8 font-display text-4xl font-black">Article unavailable.</h1>
          <p role="alert" className="mt-4 text-destructive">
            {error}
          </p>
        </section>
      </SiteChrome>
    );
  if (!article)
    return (
      <SiteChrome>
        <section className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
          <p className="text-muted-foreground">Loading article…</p>
        </section>
      </SiteChrome>
    );
  const canonical = `${window.location.origin}/articles/${article.slug}`;
  const isPublic = article.status === 'published' && article.isIndexable;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.authorName,
    },
    ...(article.coverImage
      ? {
          image: articleImageUrl(article.coverImage),
        }
      : {}),
  };
  return (
    <SiteChrome>
      <Helmet>
        <title>{article.title} | YKCircle</title>
        <meta name="description" content={article.excerpt} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${article.title} | YKCircle`} />
        <meta property="og:description" content={article.excerpt} />
        {article.coverImage && (
          <meta property="og:image" content={articleImageUrl(article.coverImage)} />
        )}
        {!isPublic && <meta name="robots" content="noindex" />}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <article className="mx-auto max-w-4xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <Link
          to={article.categorySlug ? `/articles/category/${article.categorySlug}` : '/articles'}
          className="inline-flex items-center gap-2 text-sm text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {article.categoryName || 'All articles'}
        </Link>
        <header className="mt-8 rounded-2xl border border-border/70 bg-secondary/20 p-6 sm:p-10">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">
            {article.categoryName || 'YKCircle journal'}
          </p>
          <h1 className="mt-4 break-words font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {article.excerpt}
          </p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span>By {article.authorName}</span>
            <span>{articleDate(article.publishedAt || article.updatedAt)}</span>
          </div>
          {article.tags?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/articles?tag=${encodeURIComponent(tag)}`}
                  className="ui-action rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>
        {article.coverImage && (
          <figure className="my-8 overflow-hidden rounded-2xl bg-secondary/60">
            <img
              src={articleImageUrl(article.coverImage)}
              alt={article.coverAltText || ''}
              className="max-h-[38rem] w-full object-cover"
            />
          </figure>
        )}
        <div className="mx-auto mt-10 max-w-[65ch]">
          <ArticleContent body={article.body} className="break-words text-[1.05rem] leading-8" />
        </div>
        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground">
          <span>{article.authorName && `Written by ${article.authorName}`}</span>
          <Link
            to="/articles"
            className="ui-action inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-primary"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Explore more articles
          </Link>
        </footer>
      </article>
    </SiteChrome>
  );
}
