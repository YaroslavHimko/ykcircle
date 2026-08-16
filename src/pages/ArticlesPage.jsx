import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Archive, ArrowLeft, FilePlus2, ImagePlus, Send, Trash2 } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import ArticleContent from '@/components/ArticleContent';
import { articleDate, articleImageUrl, articleRequest, articleSlug } from '@/lib/articles';
const editorRoles = ['manager', 'admin'];
const newArticle = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  categoryId: '',
  tags: [],
  status: 'draft',
  isIndexable: true,
  media: []
};
function readUser() {
  try {
    return JSON.parse(localStorage.getItem('authUser') || 'null');
  } catch {
    return null;
  }
}
function FieldError({
  errors,
  name
}) {
  return errors?.[name] ? <p className="mt-1 text-sm text-destructive">{errors[name]}</p> : null;
}
function StatusBadge({
  status
}) {
  return <span className={`border px-2 py-1 text-xs uppercase tracking-wider ${status === 'published' ? 'border-primary text-primary' : status === 'removed' ? 'border-destructive text-destructive' : 'border-border text-muted-foreground'}`}>{status}</span>;
}
function ArticleCard({
  article,
  editable = false
}) {
  const href = editable ? `/profile/articles/${article.id}/edit` : `/articles/${article.slug}`;
  return <article className="group flex h-full flex-col overflow-hidden border border-border bg-background transition-colors hover:border-primary">
    <Link to={href} className="block">
      {article.coverImage ? <img src={articleImageUrl(article.coverImage)} alt={article.coverAltText || ''} className="aspect-[16/9] w-full object-cover" /> : <div className="aspect-[16/9] bg-secondary/60" />}
    </Link>
    <div className="flex flex-1 flex-col p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-primary"><span>{article.categoryName || 'YKCircle guide'}</span>{editable && <StatusBadge status={article.status} />}</div>
      <h2 className="mt-3 font-display text-2xl font-semibold leading-tight"><Link to={href} className="group-hover:text-primary">{article.title}</Link></h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
      <div className="mt-auto pt-5 text-xs text-muted-foreground">{articleDate(article.publishedAt || article.updatedAt)} · {article.authorName}</div>
    </div>
  </article>;
}
function PublicListing({
  categorySlug = ''
}) {
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag') || '';
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
      limit: '20'
    });
    if (categorySlug) query.set('category', categorySlug);
    if (tag) query.set('tag', tag);
    Promise.all([articleRequest(`/api/articles?${query}`), articleRequest('/api/article-categories')]).then(([items, articleCategories]) => {
      if (live) {
        setArticles(Array.isArray(items) ? items : []);
        setCategories(Array.isArray(articleCategories) ? articleCategories : []);
      }
    }).catch(requestError => {
      if (live) setError(requestError.message);
    }).finally(() => {
      if (live) setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [categorySlug, tag]);
  const selected = categories.find(item => item.slug === categorySlug);
  const title = selected ? selected.name : tag ? `Articles tagged “${tag}”` : 'Stories, guides, and local knowledge.';
  return <SiteChrome><Helmet><title>{selected ? `${selected.name} articles | YKCircle` : 'Articles | YKCircle'}</title><meta name="description" content="Guides, stories, and practical ideas for making more of life together." /><link rel="canonical" href={`${window.location.origin}${categorySlug ? `/articles/category/${categorySlug}` : '/articles'}`} /></Helmet><section className="mx-auto max-w-[76rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs uppercase tracking-[0.3em] text-primary">YKCircle journal</p><h1 className="mt-3 max-w-3xl font-display text-5xl font-black leading-[0.95]">{title}</h1><p className="mt-5 max-w-2xl text-muted-foreground">Useful ideas, local perspective, and stories that help people make real plans together.</p></div></div><nav aria-label="Article categories" className="mt-10 flex flex-wrap gap-2"><Link to="/articles" className={`border px-4 py-2 text-sm ${!categorySlug ? 'border-primary text-primary' : 'border-border'}`}>All articles</Link>{categories.map(category => <Link key={category.id} to={`/articles/category/${category.slug}`} className={`border px-4 py-2 text-sm ${category.slug === categorySlug ? 'border-primary text-primary' : 'border-border'}`}>{category.name}</Link>)}</nav>{tag && <p className="mt-6 text-sm text-muted-foreground">Filtering by tag: <Link to="/articles" className="text-primary underline underline-offset-4">{tag} ×</Link></p>}{error && <p role="alert" className="mt-8 text-destructive">{error}</p>}<div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{loading ? <p className="text-muted-foreground">Loading articles…</p> : articles.map(article => <ArticleCard key={article.id} article={article} />)}{!loading && !error && articles.length === 0 && <p className="border border-border p-6 text-muted-foreground">No published articles match this view yet.</p>}</div></section></SiteChrome>;
}
function PublicArticle() {
  const {
    slug
  } = useParams();
  const token = localStorage.getItem('authToken');
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    articleRequest(`/api/articles/${encodeURIComponent(slug)}`, {
      token
    }).then(item => {
      if (live) setArticle(item);
    }).catch(requestError => {
      if (live) setError(requestError.message);
    });
    return () => {
      live = false;
    };
  }, [slug, token]);
  if (error) return <SiteChrome><section className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><Link to="/articles" className="text-sm text-primary">← All articles</Link><h1 className="mt-8 font-display text-4xl font-black">Article unavailable.</h1><p role="alert" className="mt-4 text-destructive">{error}</p></section></SiteChrome>;
  if (!article) return <SiteChrome><section className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><p className="text-muted-foreground">Loading article…</p></section></SiteChrome>;
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
      name: article.authorName
    },
    ...(article.coverImage ? {
      image: articleImageUrl(article.coverImage)
    } : {})
  };
  return <SiteChrome><Helmet><title>{article.title} | YKCircle</title><meta name="description" content={article.excerpt} /><link rel="canonical" href={canonical} /><meta property="og:title" content={`${article.title} | YKCircle`} /><meta property="og:description" content={article.excerpt} />{article.coverImage && <meta property="og:image" content={articleImageUrl(article.coverImage)} />}{!isPublic && <meta name="robots" content="noindex" />}<script type="application/ld+json">{JSON.stringify(structuredData)}</script></Helmet><article className="mx-auto max-w-4xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><Link to={article.categorySlug ? `/articles/category/${article.categorySlug}` : '/articles'} className="inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="h-4 w-4" />{article.categoryName || 'All articles'}</Link><header className="mt-8 border-b border-border pb-8"><p className="text-xs uppercase tracking-[0.25em] text-primary">{article.categoryName || 'YKCircle journal'}</p><h1 className="mt-4 font-display text-5xl font-black leading-[0.95] sm:text-6xl">{article.title}</h1><p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p><div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><span>By {article.authorName}</span><span>{articleDate(article.publishedAt || article.updatedAt)}</span></div>{article.tags?.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{article.tags.map(tag => <Link key={tag} to={`/articles?tag=${encodeURIComponent(tag)}`} className="border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary">{tag}</Link>)}</div>}</header>{article.coverImage && <figure className="my-10"><img src={articleImageUrl(article.coverImage)} alt={article.coverAltText || ''} className="max-h-[38rem] w-full object-cover" /></figure>}<ArticleContent body={article.body} className="text-[1.05rem]" /></article></SiteChrome>;
}
function ArticleEditor({
  article,
  categories,
  role,
  saving,
  errors,
  onSave,
  onPublish,
  onStatus,
  onUploadCover,
  onUploadMedia,
  onDeleteMedia
}) {
  const [form, setForm] = useState(newArticle);
  const [slugEdited, setSlugEdited] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverAlt, setCoverAlt] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaAlt, setMediaAlt] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [imageError, setImageError] = useState('');
  useEffect(() => {
    setForm({
      ...newArticle,
      ...article,
      categoryId: article?.categoryId ?? '',
      tags: article?.tags || [],
      media: article?.media || []
    });
    setCoverAlt(article?.coverAltText || '');
    setSlugEdited(Boolean(article?.id));
  }, [article?.id]);
  useEffect(() => {
    setForm(current => ({
      ...current,
      media: article?.media || []
    }));
  }, [article?.media]);
  useEffect(() => {
    const editor = document.querySelector('textarea[rows="18"]');
    if (!editor) return undefined;
    const markdownReference = 'Markdown quick reference:\n# Heading\n**bold**\n[link text](https://example.com)\n![image alt](image-url "caption")\n- Bullet item\n> Quote\n\nPut a YouTube URL on its own line to embed it.';
    const label = editor.closest('label');
    editor.title = markdownReference;
    if (label) label.title = markdownReference;
    return () => {
      editor.removeAttribute('title');
      label?.removeAttribute('title');
    };
  }, []);
  const update = (name, value) => setForm(current => ({
    ...current,
    [name]: value
  }));
  const updateTitle = value => setForm(current => ({
    ...current,
    title: value,
    slug: slugEdited ? current.slug : articleSlug(value)
  }));
  const insertMedia = media => {
    const url = media.url || `/uploads/article-images/${media.filename}`;
    setForm(current => ({
      ...current,
      body: `${current.body.trim()}\n\n![${media.altText || 'Article image'}](${url}${media.caption ? ` "${media.caption}"` : ''})\n`
    }));
  };
  const uploadCover = async () => {
    if (!coverFile) return setImageError('Choose a cover image first.');
    if (coverAlt.trim().length < 3) return setImageError('Provide cover-image alt text (at least 3 characters).');
    setImageError('');
    await onUploadCover(coverFile, coverAlt.trim());
    setCoverFile(null);
  };
  const uploadMedia = async () => {
    if (!mediaFile) return setImageError('Choose an inline image first.');
    if (mediaAlt.trim().length < 3) return setImageError('Provide image alt text (at least 3 characters).');
    setImageError('');
    const media = await onUploadMedia(mediaFile, mediaAlt.trim(), mediaCaption.trim());
    insertMedia(media);
    setMediaFile(null);
    setMediaAlt('');
    setMediaCaption('');
  };
  return <div className="mx-auto max-w-[76rem]"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs uppercase tracking-[0.3em] text-primary">Editorial workspace</p><h1 className="mt-3 font-display text-5xl font-black">{article?.id ? 'Edit article' : 'Create an article'}</h1></div>{article?.id && <StatusBadge status={article.status} />}</div><form onSubmit={event => {
      event.preventDefault();
      onSave(form);
    }} className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,.7fr)]"><div className="space-y-6"><label className="block text-sm">Title<input required minLength="8" maxLength="200" value={form.title} onChange={event => updateTitle(event.target.value)} className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label><FieldError errors={errors} name="title" /><label className="block text-sm">Slug<input required maxLength="180" value={form.slug} onChange={event => {
            setSlugEdited(true);
            update('slug', articleSlug(event.target.value));
          }} className="mt-2 min-h-12 w-full border border-border bg-background px-4" /></label><FieldError errors={errors} name="slug" /><label className="block text-sm">Excerpt<textarea required minLength="20" maxLength="400" rows="3" value={form.excerpt} onChange={event => update('excerpt', event.target.value)} className="mt-2 w-full border border-border bg-background px-4 py-3" /></label><FieldError errors={errors} name="excerpt" /><label className="block text-sm">Article body <span className="text-muted-foreground">(Markdown supported)</span><textarea required minLength="40" rows="18" value={form.body} onChange={event => update('body', event.target.value)} placeholder={'# Your first section\n\nWrite the article here. Use **bold**, [links](https://example.com), image Markdown, or a YouTube URL on its own line.'} className="mt-2 w-full border border-border bg-background px-4 py-3 font-mono text-sm leading-relaxed" /></label><FieldError errors={errors} name="body" /><div className="border border-border bg-secondary/20 p-5"><p className="text-xs uppercase tracking-[0.2em] text-primary">Live preview</p><h2 className="mt-3 font-display text-3xl font-semibold">{form.title || 'Your article title'}</h2><p className="mt-3 text-muted-foreground">{form.excerpt || 'Your article excerpt will appear here.'}</p><ArticleContent body={form.body || 'Start writing to see the article preview.'} className="mt-6 text-sm" /></div></div><aside className="space-y-6"><div className="border border-border p-5"><h2 className="font-display text-2xl font-semibold">Publishing</h2><label className="mt-5 block text-sm">Category<select value={form.categoryId} onChange={event => update('categoryId', event.target.value)} className="mt-2 min-h-11 w-full border border-border bg-background px-3"><option value="">No category</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><FieldError errors={errors} name="categoryId" /><label className="mt-5 block text-sm">Tags <span className="text-muted-foreground">(comma-separated)</span><input value={form.tags.join(', ')} onChange={event => update('tags', event.target.value.split(',').map(tag => tag.trim()).filter(Boolean))} maxLength="650" className="mt-2 min-h-11 w-full border border-border bg-background px-3" /></label>{role === 'admin' ? <label className="mt-5 flex items-center gap-3 text-sm"><input type="checkbox" checked={form.isIndexable} onChange={event => update('isIndexable', event.target.checked)} />Allow search indexing</label> : <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Published manager articles remain indexable. An administrator can change indexing if needed.</p>}<div className="mt-6 flex flex-wrap gap-3"><button disabled={saving} className="min-h-11 border border-border px-4 text-sm disabled:opacity-50">Save draft</button><button type="button" disabled={saving} onClick={() => onPublish(form)} className="inline-flex min-h-11 items-center gap-2 bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" />Publish</button></div>{article?.id && <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">{article.status === 'published' && <button type="button" disabled={saving} onClick={() => onStatus('draft')} className="text-sm text-primary">Revert to draft</button>}<button type="button" disabled={saving} onClick={() => onStatus('archived')} className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Archive className="h-4 w-4" />Archive</button>{role === 'admin' && <button type="button" disabled={saving} onClick={() => onStatus('removed')} className="inline-flex items-center gap-1 text-sm text-destructive"><Trash2 className="h-4 w-4" />Remove</button>}</div>}</div>{article?.id ? <><div className="border border-border p-5"><h2 className="font-display text-2xl font-semibold">Cover image</h2>{article.coverImage && <img src={articleImageUrl(article.coverImage)} alt={article.coverAltText || ''} className="mt-4 aspect-[16/9] w-full object-cover" />}<label className="mt-4 block text-sm">Image<input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={event => setCoverFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-sm" /></label><label className="mt-4 block text-sm">Alt text<input value={coverAlt} onChange={event => setCoverAlt(event.target.value)} minLength="3" maxLength="200" className="mt-2 min-h-11 w-full border border-border bg-background px-3" /></label><button type="button" disabled={saving} onClick={uploadCover} className="mt-4 inline-flex min-h-10 items-center gap-2 border border-border px-4 text-sm disabled:opacity-50"><ImagePlus className="h-4 w-4" />Upload cover</button></div><div className="border border-border p-5"><h2 className="font-display text-2xl font-semibold">Inline images</h2><p className="mt-2 text-sm text-muted-foreground">Upload an image, then it is inserted into the Markdown editor. Save the article to keep that placement.</p><label className="mt-4 block text-sm">Image<input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={event => setMediaFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-sm" /></label><label className="mt-4 block text-sm">Alt text<input value={mediaAlt} onChange={event => setMediaAlt(event.target.value)} minLength="3" maxLength="200" className="mt-2 min-h-11 w-full border border-border bg-background px-3" /></label><label className="mt-4 block text-sm">Caption <span className="text-muted-foreground">(optional)</span><input value={mediaCaption} onChange={event => setMediaCaption(event.target.value)} maxLength="500" className="mt-2 min-h-11 w-full border border-border bg-background px-3" /></label><button type="button" disabled={saving} onClick={uploadMedia} className="mt-4 inline-flex min-h-10 items-center gap-2 border border-border px-4 text-sm disabled:opacity-50"><ImagePlus className="h-4 w-4" />Upload and insert</button>{form.media.length > 0 && <div className="mt-5 space-y-3 border-t border-border pt-4">{form.media.map(media => <div key={media.id} className="flex items-center gap-3"><img src={articleImageUrl(media.url || media.filename)} alt={media.altText || ''} className="h-12 w-16 object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm">{media.altText || media.filename}</p><button type="button" onClick={() => insertMedia(media)} className="text-xs text-primary">Insert again</button></div><button type="button" disabled={saving} onClick={() => onDeleteMedia(media)} className="text-xs text-destructive">Remove</button></div>)}</div>}</div></> : <div className="border border-dashed border-border p-5 text-sm leading-relaxed text-muted-foreground">Save the first draft to unlock cover and inline image uploads.</div>}{imageError && <p role="alert" className="text-sm text-destructive">{imageError}</p>}</aside></form></div>;
}
function EditorialWorkspace({
  view
}) {
  const navigate = useNavigate();
  const {
    id
  } = useParams();
  const token = localStorage.getItem('authToken');
  const user = readUser();
  const permitted = editorRoles.includes(user?.role);
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
      const [items, articleCategories] = await Promise.all([articleRequest('/api/my/articles', {
        token
      }), articleRequest('/api/article-categories')]);
      const nextArticles = Array.isArray(items) ? items : [];
      setArticles(nextArticles);
      setCategories(Array.isArray(articleCategories) ? articleCategories : []);
      if (view === 'edit') {
        const summary = nextArticles.find(item => String(item.id) === String(id));
        if (!summary) throw new Error('This article is unavailable or you do not have permission to edit it.');
        setCurrent(await articleRequest(`/api/articles/${encodeURIComponent(summary.slug)}`, {
          token
        }));
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
      isIndexable: form.isIndexable
    };
    try {
      const saved = current?.id ? await articleRequest(`/api/articles/${current.id}`, {
        token,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }) : await articleRequest('/api/articles', {
        token,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      let next = {
        ...saved,
        media: saved.media || current?.media || []
      };
      if (publish) {
        await articleRequest(`/api/articles/${saved.id}/status`, {
          token,
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'published'
          })
        });
        next = {
          ...next,
          status: 'published',
          publishedAt: next.publishedAt || new Date().toISOString()
        };
      }
      setCurrent(next);
      setArticles(items => [next, ...items.filter(item => item.id !== next.id)]);
      setNotice(publish ? 'Article published.' : 'Draft saved.');
      if (!current?.id) navigate(`/profile/articles/${saved.id}/edit`, {
        replace: true
      });
    } catch (requestError) {
      setErrors(requestError.fields || {});
      setError(requestError.status === 409 ? 'That slug is already in use. Choose a different one.' : requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const changeStatus = status => {
    const action = async () => {
      setSaving(true);
      try {
        await articleRequest(`/api/articles/${current.id}/status`, {
          token,
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status
          })
        });
        setCurrent(item => ({
          ...item,
          status
        }));
        setArticles(items => items.map(item => item.id === current.id ? {
          ...item,
          status
        } : item));
        setNotice(status === 'removed' ? 'Article removed from the CMS.' : `Article ${status}.`);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setSaving(false);
        setConfirmation(null);
      }
    };
    if (status === 'archived' || status === 'removed') setConfirmation({
      title: status === 'removed' ? 'Remove this article?' : 'Archive this article?',
      description: status === 'removed' ? 'The article will no longer be available to readers or editors.' : 'The article will be removed from public view but kept in the CMS.',
      label: status === 'removed' ? 'Remove article' : 'Archive article',
      destructive: status === 'removed',
      action
    });else action();
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
        body: formData
      });
      setCurrent(item => ({
        ...item,
        ...data
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
        body: formData
      });
      setCurrent(item => ({
        ...item,
        media: [...(item.media || []), data]
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
  const deleteMedia = media => setConfirmation({
    title: 'Remove this image?',
    description: 'It will be removed from image storage. Remove any Markdown reference from the article body before saving.',
    label: 'Remove image',
    destructive: true,
    action: async () => {
      setSaving(true);
      try {
        await articleRequest(`/api/articles/${current.id}/media/${media.id}`, {
          token,
          method: 'DELETE'
        });
        setCurrent(item => ({
          ...item,
          media: item.media.filter(itemMedia => itemMedia.id !== media.id)
        }));
        setNotice('Inline image removed.');
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setSaving(false);
        setConfirmation(null);
      }
    }
  });
  if (!permitted) return <SiteChrome><Helmet><title>Article workspace | YKCircle</title><meta name="robots" content="noindex" /></Helmet><section className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><h1 className="font-display text-5xl font-black">Editorial access required.</h1><p className="mt-5 text-muted-foreground">Only managers and administrators can create or manage YKCircle articles.</p>{!user && <Link to="/login?from=%2Fprofile%2Farticles" className="mt-7 inline-flex min-h-11 items-center bg-primary px-5 text-sm text-primary-foreground">Log in</Link>}</section></SiteChrome>;
  if (view === 'list') return <SiteChrome><Helmet><title>Manage articles | YKCircle</title><meta name="robots" content="noindex" /></Helmet><section className="mx-auto max-w-[76rem] px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs uppercase tracking-[0.3em] text-primary">Editorial workspace</p><h1 className="mt-3 font-display text-5xl font-black">Articles</h1><p className="mt-5 max-w-2xl text-muted-foreground">Create drafts, edit your articles, and publish when they are ready for readers.</p></div><Link to="/profile/articles/new" className="inline-flex min-h-11 items-center gap-2 bg-primary px-5 text-sm text-primary-foreground"><FilePlus2 className="h-4 w-4" />New article</Link></div>{error && <p role="alert" className="mt-6 text-destructive">{error}</p>}<div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{loading ? <p className="text-muted-foreground">Loading articles…</p> : articles.map(article => <ArticleCard key={article.id} article={article} editable />)}{!loading && articles.length === 0 && <div className="border border-border p-6 text-muted-foreground">No articles yet. Create your first draft to begin.</div>}</div></section></SiteChrome>;
  const editorArticle = current || (view === 'new' ? newArticle : null);
  return <SiteChrome><Helmet><title>{view === 'new' ? 'New article' : 'Edit article'} | YKCircle</title><meta name="robots" content="noindex" /></Helmet><section className="px-5 pb-24 pt-32 sm:px-8 sm:pt-40">{loading && view === 'edit' ? <p className="mx-auto max-w-3xl text-muted-foreground">Loading article…</p> : editorArticle && <ArticleEditor article={editorArticle} categories={categories} role={user.role} saving={saving} errors={errors} onSave={persist} onPublish={form => persist(form, true)} onStatus={changeStatus} onUploadCover={uploadCover} onUploadMedia={uploadMedia} onDeleteMedia={deleteMedia} />}{error && <p role="alert" className="fixed bottom-6 right-6 z-50 max-w-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg">{error}</p>}{notice && <p role="status" className="fixed bottom-6 right-6 z-50 max-w-md border border-primary/30 bg-background px-4 py-3 text-sm shadow-lg">{notice}</p>}</section>{confirmation && <ConfirmationDialog title={confirmation.title} description={confirmation.description} confirmLabel={confirmation.label} destructive={confirmation.destructive} busy={saving} onCancel={() => setConfirmation(null)} onConfirm={confirmation.action} />}</SiteChrome>;
}
export default function ArticlesPage({
  view = 'list'
}) {
  const {
    category
  } = useParams();
  if (view === 'detail') return <PublicArticle />;
  if (view === 'workspace' || view === 'new' || view === 'edit') {
    const workspaceView = view === 'workspace' ? 'list' : view;
    return <EditorialWorkspace key={workspaceView} view={workspaceView} />;
  }
  return <PublicListing categorySlug={category || ''} />;
}
