import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import SiteChrome from '@/shared/components/SiteChrome.jsx';
import DirectoryActions from '@/shared/components/DirectoryActions.jsx';
import DirectoryHeader from '@/shared/components/DirectoryHeader.jsx';
import { articleRequest } from '../api/articles.js';
import { ArticleCard } from '../components/ArticleCard.jsx';
export function PublicListing({ categorySlug = '' }) {
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag') || '';
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [own, setOwn] = useState({
    loading: Boolean(token),
    articles: [],
    error: '',
  });
  useEffect(() => {
    const refresh = () => setToken(localStorage.getItem('authToken'));
    window.addEventListener('auth-change', refresh);
    return () => window.removeEventListener('auth-change', refresh);
  }, []);
  useEffect(() => {
    if (!token) {
      setOwn({
        loading: false,
        articles: [],
        error: '',
      });
      return;
    }
    let active = true;
    setOwn({
      loading: true,
      articles: [],
      error: '',
    });
    articleRequest('/api/my/articles?ownedOnly=true', {
      token,
    })
      .then((items) => {
        if (active)
          setOwn({
            loading: false,
            articles: Array.isArray(items) ? items : [],
            error: '',
          });
      })
      .catch((error) => {
        if (active)
          setOwn({
            loading: false,
            articles: [],
            error: error.message,
          });
      });
    return () => {
      active = false;
    };
  }, [token]);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    const query = new URLSearchParams({
      page: '1',
      limit: '20',
    });
    if (categorySlug) query.set('category', categorySlug);
    if (tag) query.set('tag', tag);
    Promise.all([
      articleRequest(`/api/articles?${query}`),
      articleRequest('/api/article-categories'),
    ])
      .then(([items, articleCategories]) => {
        if (live) {
          setArticles(Array.isArray(items) ? items : []);
          setCategories(Array.isArray(articleCategories) ? articleCategories : []);
        }
      })
      .catch((requestError) => {
        if (live) setError(requestError.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [categorySlug, tag]);
  const selected = categories.find((item) => item.slug === categorySlug);
  const ownedIds = new Set(own.articles.map((article) => String(article.id)));
  const otherArticles = articles.filter((article) => !token || !ownedIds.has(String(article.id)));
  const title = selected
    ? selected.name
    : tag
      ? `Articles tagged “${tag}”`
      : 'Stories, guides, and local knowledge.';
  return (
    <SiteChrome>
      <Helmet>
        <title>{selected ? `${selected.name} articles | YKCircle` : 'Articles | YKCircle'}</title>
        <meta
          name="description"
          content="Guides, stories, and practical ideas for making more of life together."
        />
        <link
          rel="canonical"
          href={`${window.location.origin}${categorySlug ? `/articles/category/${categorySlug}` : '/articles'}`}
        />
      </Helmet>
      <section className="directory-page">
        <DirectoryHeader
          eyebrow="YKCircle journal"
          title={title}
          description="Useful ideas, local perspective, and stories that help people make real plans together."
        />
        <DirectoryActions
          manageTo={token ? '/profile/articles' : null}
          manageLabel="Manage articles"
          createTo={token ? '/profile/articles/new' : '/login?from=%2Fprofile%2Farticles%2Fnew'}
          createLabel="New article"
        />
        {token && (
          <section className="mt-10" aria-labelledby="my-articles-title">
            <h2 id="my-articles-title" className="font-display text-3xl font-semibold">
              My Articles
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Your drafts, published articles, and archived stories. Select an article to edit it.
            </p>
            {own.error && (
              <p role="alert" className="mt-5 text-destructive">
                {own.error}
              </p>
            )}
            {own.loading ? (
              <p role="status" className="mt-5 text-muted-foreground">
                Loading your articles…
              </p>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {own.articles.map((article) => (
                  <ArticleCard key={article.id} article={article} editable />
                ))}
              </div>
            )}
            {!own.loading && !own.error && !own.articles.length && (
              <p className="mt-5 text-muted-foreground">
                No articles yet. Create your first draft to begin.
              </p>
            )}
          </section>
        )}
        {token && <h2 className="mt-12 font-display text-3xl font-semibold">Browse Articles</h2>}
        <nav aria-label="Article categories" className="mt-10 flex flex-wrap gap-2">
          <Link
            to="/articles"
            className={`ui-action directory-filter border px-4 py-2 text-sm ${!categorySlug ? 'border-primary text-primary' : 'border-border'}`}
          >
            All articles
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/articles/category/${category.slug}`}
              className={`ui-action directory-filter border px-4 py-2 text-sm ${category.slug === categorySlug ? 'border-primary text-primary' : 'border-border'}`}
            >
              {category.name}
            </Link>
          ))}
        </nav>
        {tag && (
          <p className="mt-6 text-sm text-muted-foreground">
            Filtering by tag:{' '}
            <Link to="/articles" className="text-primary underline underline-offset-4">
              {tag} ×
            </Link>
          </p>
        )}
        {error && (
          <p role="alert" className="mt-8 text-destructive">
            {error}
          </p>
        )}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading || (token && own.loading) ? (
            <p className="text-muted-foreground">Loading articles…</p>
          ) : (
            otherArticles.map((article) => <ArticleCard key={article.id} article={article} />)
          )}
          {!loading && !error && !own.loading && otherArticles.length === 0 && (
            <p className="rounded-2xl border border-border p-6 text-muted-foreground">
              {articles.length
                ? 'Your matching articles are listed above. No other articles match this view.'
                : 'No published articles match this view yet.'}
            </p>
          )}
        </div>
      </section>
    </SiteChrome>
  );
}
