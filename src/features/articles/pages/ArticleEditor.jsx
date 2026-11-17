import PageHeader from '@/shared/components/PageHeader.jsx';
import { useEffect, useState } from 'react';
import { Archive, ImagePlus, Send, Trash2 } from 'lucide-react';
import ArticleContent from '../components/ArticleContent.jsx';
import { articleImageUrl, articleSlug } from '../api/articles.js';
import { newArticle } from '../model/article-editor.js';
import { FieldError } from '../components/FieldError.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
export function ArticleEditor({
  accessPanel,
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
  onDeleteMedia,
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
      media: article?.media || [],
    });
    setCoverAlt(article?.coverAltText || '');
    setSlugEdited(Boolean(article?.id));
  }, [article?.id]);
  useEffect(() => {
    setForm((current) => ({
      ...current,
      media: article?.media || [],
    }));
  }, [article?.media]);
  useEffect(() => {
    const editor = document.querySelector('textarea[rows="18"]');
    if (!editor) return undefined;
    const markdownReference =
      'Markdown quick reference:\n# Heading (H1)\n## Subheading (H2)\n**bold** and *italic*\n[link text](https://example.com)\n![image alt](image-url "caption")\n- Bullet item\n> Quote\n\nSeparate paragraphs with a blank line. Put a YouTube URL on its own line to embed it.';
    const addHint = (control, reference, labelText) => {
      if (!control) return () => {};
      const label = control.closest('label');
      if (!label) return () => {};
      const hint = document.createElement('span');
      hint.textContent = '?';
      hint.title = reference;
      hint.setAttribute('aria-label', labelText);
      hint.tabIndex = 0;
      hint.className =
        'ml-1.5 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-primary bg-transparent text-[10px] font-bold leading-none text-primary align-middle';
      label.insertBefore(hint, control);
      control.title = reference;
      return () => {
        control.removeAttribute('title');
        hint.remove();
      };
    };
    const slug = [...document.querySelectorAll('label')]
      .find((label) => label.textContent.trim().startsWith('Slug'))
      ?.querySelector('input');
    const excerpt = [...document.querySelectorAll('label')]
      .find((label) => label.textContent.trim().startsWith('Excerpt'))
      ?.querySelector('textarea');
    const cleanups = [
      addHint(editor, markdownReference, 'Show Markdown formatting reference'),
      addHint(
        slug,
        'A short, web-friendly identifier used in the article URL. Example: stockholm-weekend-guide.',
        'Explain article slug',
      ),
      addHint(
        excerpt,
        'A brief summary shown in article cards and search previews. Example: A practical two-day guide to exploring Stockholm.',
        'Explain article excerpt',
      ),
    ];
    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);
  const update = (name, value) =>
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  const updateTitle = (value) =>
    setForm((current) => ({
      ...current,
      title: value,
      slug: slugEdited ? current.slug : articleSlug(value),
    }));
  const insertMedia = (media) => {
    const url = media.url || `/uploads/article-images/${media.filename}`;
    setForm((current) => ({
      ...current,
      body: `${current.body.trim()}\n\n![${media.altText || 'Article image'}](${url}${media.caption ? ` "${media.caption}"` : ''})\n`,
    }));
  };
  const uploadCover = async () => {
    if (!coverFile) return setImageError('Choose a cover image first.');
    if (coverAlt.trim().length < 3)
      return setImageError('Provide cover-image alt text (at least 3 characters).');
    setImageError('');
    await onUploadCover(coverFile, coverAlt.trim());
    setCoverFile(null);
  };
  const uploadMedia = async () => {
    if (!mediaFile) return setImageError('Choose an inline image first.');
    if (mediaAlt.trim().length < 3)
      return setImageError('Provide image alt text (at least 3 characters).');
    setImageError('');
    const media = await onUploadMedia(mediaFile, mediaAlt.trim(), mediaCaption.trim());
    insertMedia(media);
    setMediaFile(null);
    setMediaAlt('');
    setMediaCaption('');
  };
  return (
    <div>
      <div className="space-y-6">
        <div>
          <PageHeader
            eyebrow="Editorial workspace"
            title={article?.id ? 'Edit article' : 'Create an article'}
          />
        </div>
        {article?.id && <StatusBadge status={article.status} />}
      </div>
      {accessPanel}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
        className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,.7fr)]"
      >
        <div className="space-y-6">
          <label className="block text-sm">
            Title
            <input
              required
              minLength="8"
              maxLength="200"
              value={form.title}
              onChange={(event) => updateTitle(event.target.value)}
              className="mt-2 min-h-12 w-full border border-border bg-background px-4"
            />
          </label>
          <FieldError errors={errors} name="title" />
          <label className="block text-sm">
            Slug
            <input
              required
              maxLength="180"
              value={form.slug}
              onChange={(event) => {
                setSlugEdited(true);
                update('slug', articleSlug(event.target.value));
              }}
              className="mt-2 min-h-12 w-full border border-border bg-background px-4"
            />
          </label>
          <FieldError errors={errors} name="slug" />
          <label className="block text-sm">
            Excerpt
            <textarea
              required
              minLength="20"
              maxLength="400"
              rows="3"
              value={form.excerpt}
              onChange={(event) => update('excerpt', event.target.value)}
              className="mt-2 w-full border border-border bg-background px-4 py-3"
            />
          </label>
          <FieldError errors={errors} name="excerpt" />
          <label className="block text-sm">
            Article body <span className="text-muted-foreground">(Markdown supported)</span>
            <textarea
              required
              minLength="40"
              rows="18"
              value={form.body}
              onChange={(event) => update('body', event.target.value)}
              placeholder={
                '# Your first section\n\nWrite the article here. Use **bold**, [links](https://example.com), image Markdown, or a YouTube URL on its own line.'
              }
              className="mt-2 w-full border border-border bg-background px-4 py-3 font-mono text-sm leading-relaxed"
            />
          </label>
          <FieldError errors={errors} name="body" />
          <div className="rounded-2xl border border-border bg-secondary/20 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Live preview</p>
            <h2 className="mt-3 font-display text-3xl font-semibold">
              {form.title || 'Your article title'}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {form.excerpt || 'Your article excerpt will appear here.'}
            </p>
            <ArticleContent
              body={form.body || 'Start writing to see the article preview.'}
              className="mt-6 text-sm"
            />
          </div>
        </div>
        <aside className="space-y-6">
          <div className="rounded-2xl border border-border p-5">
            <h2 className="font-display text-2xl font-semibold">Publishing</h2>
            <label className="mt-5 block text-sm">
              Category
              <select
                value={form.categoryId}
                onChange={(event) => update('categoryId', event.target.value)}
                className="mt-2 min-h-11 w-full border border-border bg-background px-3"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <FieldError errors={errors} name="categoryId" />
            <label className="mt-5 block text-sm">
              Tags <span className="text-muted-foreground">(comma-separated)</span>
              <input
                value={form.tags.join(', ')}
                onChange={(event) =>
                  update(
                    'tags',
                    event.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  )
                }
                maxLength="650"
                className="mt-2 min-h-11 w-full border border-border bg-background px-3"
              />
            </label>
            {role === 'admin' ? (
              <label className="mt-5 flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.isIndexable}
                  onChange={(event) => update('isIndexable', event.target.checked)}
                />
                Allow search indexing
              </label>
            ) : (
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                Published articles remain indexable. An administrator can change indexing if needed.
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                disabled={saving}
                className="ui-action min-h-11 border border-border px-4 text-sm disabled:opacity-50"
              >
                Save draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => onPublish(form)}
                className="ui-action inline-flex min-h-11 items-center gap-2 bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Publish
              </button>
            </div>
            {article?.id && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                {article.status === 'published' && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => onStatus('draft')}
                    className="text-sm text-primary"
                  >
                    Revert to draft
                  </button>
                )}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onStatus('archived')}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
                {role === 'admin' && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => onStatus('removed')}
                    className="inline-flex items-center gap-1 text-sm text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
          {article?.id ? (
            <>
              <div className="rounded-2xl border border-border p-5">
                <h2 className="font-display text-2xl font-semibold">Cover image</h2>
                {article.coverImage && (
                  <img
                    src={articleImageUrl(article.coverImage)}
                    alt={article.coverAltText || ''}
                    className="mt-4 aspect-[16/9] w-full object-cover"
                  />
                )}
                <label className="mt-4 block text-sm">
                  Image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(event) => setCoverFile(event.target.files?.[0] || null)}
                    className="mt-2 block w-full text-sm"
                  />
                </label>
                <label className="mt-4 block text-sm">
                  Alt text
                  <input
                    value={coverAlt}
                    onChange={(event) => setCoverAlt(event.target.value)}
                    minLength="3"
                    maxLength="200"
                    className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={uploadCover}
                  className="ui-action mt-4 inline-flex min-h-10 items-center gap-2 border border-border px-4 text-sm disabled:opacity-50"
                >
                  <ImagePlus className="h-4 w-4" />
                  Upload cover
                </button>
              </div>
              <div className="rounded-2xl border border-border p-5">
                <h2 className="font-display text-2xl font-semibold">Inline images</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload an image, then it is inserted into the Markdown editor. Save the article to
                  keep that placement.
                </p>
                <label className="mt-4 block text-sm">
                  Image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(event) => setMediaFile(event.target.files?.[0] || null)}
                    className="mt-2 block w-full text-sm"
                  />
                </label>
                <label className="mt-4 block text-sm">
                  Alt text
                  <input
                    value={mediaAlt}
                    onChange={(event) => setMediaAlt(event.target.value)}
                    minLength="3"
                    maxLength="200"
                    className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                  />
                </label>
                <label className="mt-4 block text-sm">
                  Caption <span className="text-muted-foreground">(optional)</span>
                  <input
                    value={mediaCaption}
                    onChange={(event) => setMediaCaption(event.target.value)}
                    maxLength="500"
                    className="mt-2 min-h-11 w-full border border-border bg-background px-3"
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={uploadMedia}
                  className="ui-action mt-4 inline-flex min-h-10 items-center gap-2 border border-border px-4 text-sm disabled:opacity-50"
                >
                  <ImagePlus className="h-4 w-4" />
                  Upload and insert
                </button>
                {form.media.length > 0 && (
                  <div className="mt-5 space-y-3 border-t border-border pt-4">
                    {form.media.map((media) => (
                      <div key={media.id} className="flex items-center gap-3">
                        <img
                          src={articleImageUrl(media.url || media.filename)}
                          alt={media.altText || ''}
                          className="h-12 w-16 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{media.altText || media.filename}</p>
                          <button
                            type="button"
                            onClick={() => insertMedia(media)}
                            className="text-xs text-primary"
                          >
                            Insert again
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => onDeleteMedia(media)}
                          className="text-xs text-destructive"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-5 text-sm leading-relaxed text-muted-foreground">
              Save the first draft to unlock cover and inline image uploads.
            </div>
          )}
          {imageError && (
            <p role="alert" className="text-sm text-destructive">
              {imageError}
            </p>
          )}
        </aside>
      </form>
    </div>
  );
}
