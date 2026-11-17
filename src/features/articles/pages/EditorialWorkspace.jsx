import PageHeader from '@/shared/components/PageHeader.jsx';
import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FilePlus2 } from 'lucide-react';
import SiteChrome from '@/shared/components/SiteChrome.jsx';
import ConfirmationDialog from '@/shared/components/ConfirmationDialog.jsx';
import { articleRequest } from '../api/articles.js';
import { editorRoles, newArticle, readUser } from '../model/article-editor.js';
import { ArticleCard } from '../components/ArticleCard.jsx';
import { ArticleEditor } from './ArticleEditor.jsx';
import { ArticleAccessPanel } from '../components/ArticleAccessPanel.jsx';
export function EditorialWorkspace({ view }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem('authToken');
  const user = readUser();
  const permitted = editorRoles.includes(user?.role);
  const [articleAccess, setArticleAccess] = useState(null);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [current, setCurrent] = useState(view === 'new' ? newArticle : null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const load = useCallback(async () => {
    if (!permitted) return;
    setLoading(true);
    setError('');
    try {
      const [items, articleCategories, access] = await Promise.all([
        articleRequest('/api/my/articles', {
          token,
        }),
        articleRequest('/api/article-categories'),
        view === 'list'
          ? Promise.resolve(null)
          : articleRequest('/api/my/article-access', {
              token,
            }),
      ]);
      setArticleAccess(access);
      const nextArticles = Array.isArray(items) ? items : [];
      setArticles(nextArticles);
      setCategories(Array.isArray(articleCategories) ? articleCategories : []);
      if (view === 'edit') {
        const summary = nextArticles.find((item) => String(item.id) === String(id));
        if (!summary)
          throw new Error('This article is unavailable or you do not have permission to edit it.');
        setCurrent(
          await articleRequest(`/api/articles/${encodeURIComponent(summary.slug)}`, {
            token,
          }),
        );
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [id, permitted, token, view]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!notice && !error) return undefined;
    const timeout = window.setTimeout(() => {
      setNotice('');
      setError('');
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [notice, error]);
  const persist = async (form, publish = false) => {
    setSaving(true);
    setErrors({});
    setError('');
    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      body: form.body,
      categoryId: form.categoryId || null,
      tags: form.tags,
      status: 'draft',
      isIndexable: form.isIndexable,
    };
    try {
      const saved = current?.id
        ? await articleRequest(`/api/articles/${current.id}`, {
            token,
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })
        : await articleRequest('/api/articles', {
            token,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
      let next = {
        ...saved,
        media: saved.media || current?.media || [],
      };
      // Keep the saved draft available even when publishing requires a subscription.
      setCurrent(next);
      setArticles((items) => [next, ...items.filter((item) => item.id !== next.id)]);
      if (publish) {
        await articleRequest(`/api/articles/${saved.id}/status`, {
          token,
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'published',
          }),
        });
        next = {
          ...next,
          status: 'published',
          publishedAt: next.publishedAt || new Date().toISOString(),
        };
      }
      setCurrent(next);
      setArticles((items) => [next, ...items.filter((item) => item.id !== next.id)]);
      setNotice(publish ? 'Article published.' : 'Draft saved.');
      if (publish)
        articleRequest('/api/my/article-access', {
          token,
        })
          .then(setArticleAccess)
          .catch(() => {});
      if (!current?.id)
        navigate(`/profile/articles/${saved.id}/edit`, {
          replace: true,
        });
    } catch (requestError) {
      setErrors(requestError.fields || {});
      setError(requestError.message);
      if (
        requestError.code === 'ARTICLE_SUBSCRIPTION_REQUIRED' &&
        requestError.subscribeUrl?.startsWith('/profile/subscriptions?')
      )
        navigate(requestError.subscribeUrl);
    } finally {
      setSaving(false);
    }
  };
  const changeStatus = (status) => {
    const action = async () => {
      setSaving(true);
      try {
        await articleRequest(`/api/articles/${current.id}/status`, {
          token,
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
          }),
        });
        setCurrent((item) => ({
          ...item,
          status,
        }));
        setArticles((items) =>
          items.map((item) =>
            item.id === current.id
              ? {
                  ...item,
                  status,
                }
              : item,
          ),
        );
        setNotice(status === 'removed' ? 'Article removed from the CMS.' : `Article ${status}.`);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setSaving(false);
        setConfirmation(null);
      }
    };
    if (status === 'archived' || status === 'removed')
      setConfirmation({
        title: status === 'removed' ? 'Remove this article?' : 'Archive this article?',
        description:
          status === 'removed'
            ? 'The article will no longer be available to readers or editors.'
            : 'The article will be removed from public view but kept in the CMS.',
        label: status === 'removed' ? 'Remove article' : 'Archive article',
        destructive: status === 'removed',
        action,
      });
    else action();
  };
  const uploadCover = async (file, altText) => {
    if (uploading) return;
    setUploading('cover');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('altText', altText);
      const data = await articleRequest(`/api/articles/${current.id}/cover`, {
        token,
        method: 'POST',
        body: formData,
      });
      setCurrent((item) => ({
        ...item,
        ...data,
      }));
      setNotice('Cover image uploaded.');
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setUploading('');
    }
  };
  const uploadMedia = async (file, altText, caption) => {
    if (uploading) return;
    setUploading('media');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('altText', altText);
      if (caption) formData.append('caption', caption);
      const data = await articleRequest(`/api/articles/${current.id}/media`, {
        token,
        method: 'POST',
        body: formData,
      });
      setCurrent((item) => ({
        ...item,
        media: [...(item.media || []), data],
      }));
      setNotice('Inline image uploaded and inserted into the editor.');
      return data;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setUploading('');
    }
  };
  const deleteMedia = (media) =>
    setConfirmation({
      title: 'Remove this image?',
      description:
        'It will be removed from image storage. Remove any Markdown reference from the article body before saving.',
      label: 'Remove image',
      destructive: true,
      action: async () => {
        setSaving(true);
        try {
          await articleRequest(`/api/articles/${current.id}/media/${media.id}`, {
            token,
            method: 'DELETE',
          });
          setCurrent((item) => ({
            ...item,
            media: item.media.filter((itemMedia) => itemMedia.id !== media.id),
          }));
          setNotice('Inline image removed.');
        } catch (requestError) {
          setError(requestError.message);
        } finally {
          setSaving(false);
          setConfirmation(null);
        }
      },
    });
  if (!permitted)
    return (
      <SiteChrome>
        <Helmet>
          <title>Article workspace | YKCircle</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <section className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
          <h1 className="font-display text-5xl font-black">Log in to write articles.</h1>
          <p className="mt-5 text-muted-foreground">
            Log in to create drafts and share stories with the community.
          </p>
          {!user && (
            <Link
              to="/login?from=%2Fprofile%2Farticles"
              className="ui-action mt-7 inline-flex min-h-11 items-center bg-primary px-5 text-sm text-primary-foreground"
            >
              Log in
            </Link>
          )}
        </section>
      </SiteChrome>
    );
  if (view === 'list')
    return (
      <SiteChrome>
        <Helmet>
          <title>Manage articles | YKCircle</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <section className="page-container">
          <div className="space-y-6">
            <div>
              <PageHeader
                eyebrow="Editorial workspace"
                title={<>Articles</>}
                description={
                  <>
                    Create drafts, edit your articles, and publish when they are ready for readers.
                  </>
                }
              />
            </div>
            <Link
              to="/profile/articles/new"
              className="ui-action inline-flex min-h-11 items-center gap-2 bg-primary px-5 text-sm text-primary-foreground"
            >
              <FilePlus2 className="h-4 w-4" />
              New article
            </Link>
          </div>
          {error && (
            <p role="alert" className="mt-6 text-destructive">
              {error}
            </p>
          )}
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <p className="text-muted-foreground">Loading articles…</p>
            ) : (
              articles.map((article) => <ArticleCard key={article.id} article={article} editable />)
            )}
            {!loading && articles.length === 0 && (
              <div className="rounded-2xl border border-border p-6 text-muted-foreground">
                No articles yet. Create your first draft to begin.
              </div>
            )}
          </div>
        </section>
      </SiteChrome>
    );
  const editorArticle = current || (view === 'new' ? newArticle : null);
  return (
    <SiteChrome>
      <Helmet>
        <title>{view === 'new' ? 'New article' : 'Edit article'} | YKCircle</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <section className="page-container">
        {loading && view === 'edit' ? (
          <p className="mx-auto max-w-3xl text-muted-foreground">Loading article…</p>
        ) : (
          editorArticle && (
            <ArticleEditor
              accessPanel={<ArticleAccessPanel access={articleAccess} />}
              article={editorArticle}
              categories={categories}
              role={user.role}
              saving={saving}
              errors={errors}
              onSave={persist}
              onPublish={(form) => persist(form, true)}
              onStatus={changeStatus}
              onUploadCover={uploadCover}
              onUploadMedia={uploadMedia}
              onDeleteMedia={deleteMedia}
            />
          )
        )}
        {error && (
          <p
            role="alert"
            className="fixed bottom-6 right-6 z-50 max-w-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="fixed bottom-6 right-6 z-50 max-w-md border border-primary/30 bg-background px-4 py-3 text-sm shadow-lg"
          >
            {notice}
          </p>
        )}
      </section>
      {confirmation && (
        <ConfirmationDialog
          title={confirmation.title}
          description={confirmation.description}
          confirmLabel={confirmation.label}
          destructive={confirmation.destructive}
          busy={saving}
          onCancel={() => setConfirmation(null)}
          onConfirm={confirmation.action}
        />
      )}
    </SiteChrome>
  );
}
