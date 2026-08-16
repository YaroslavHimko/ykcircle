import React from 'react';
import { articleImageUrl } from '@/lib/articles';

function InlineText({ value }) {
  const parts = String(value || '').split(/(\[[^\]]+\]\([^\s)]+\)|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    if (link) {
      const href = /^(https?:\/\/|\/|#)/i.test(link[2]) ? link[2] : '#';
      const external = /^https?:\/\//i.test(href);
      return <a key={index} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="text-primary underline underline-offset-4">{link[1]}</a>;
    }
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function MarkdownImage({ line }) {
  const match = line.match(/^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/);
  if (!match) return null;
  return <figure className="my-8"><img src={articleImageUrl(match[2])} alt={match[1]} className="max-h-[34rem] w-full object-cover" />{match[3] && <figcaption className="mt-2 text-sm text-muted-foreground">{match[3]}</figcaption>}</figure>;
}

function youtubeVideoId(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, '').toLowerCase();
    const id = hostname === 'youtu.be'
      ? url.pathname.slice(1).split('/')[0]
      : hostname.endsWith('youtube.com')
        ? url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1]
        : null;
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function YouTubeEmbed({ line }) {
  const markdownLink = line.match(/^\[[^\]]*\]\((https?:\/\/[^\s)]+)\)$/);
  const videoId = youtubeVideoId(markdownLink?.[1] || line);
  if (!videoId) return null;

  return <figure className="my-8 w-full max-w-xl overflow-hidden border border-border bg-black shadow-sm">
    <div className="aspect-video">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title="YouTube video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  </figure>;
}

export default function ArticleContent({ body, className = '' }) {
  const blocks = String(body || '').trim().split(/\n\s*\n/).filter(Boolean);
  return <div className={`space-y-5 leading-relaxed ${className}`}>
    {blocks.map((block, index) => {
      const image = MarkdownImage({ line: block.trim() });
      if (image) return <React.Fragment key={index}>{image}</React.Fragment>;
      const video = YouTubeEmbed({ line: block.trim() });
      if (video) return <React.Fragment key={index}>{video}</React.Fragment>;
      const heading = block.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        const Heading = `h${heading[1].length}`;
        const classes = ['text-3xl font-semibold', 'text-2xl font-semibold', 'text-xl font-semibold'];
        return <Heading key={index} className={`font-display ${classes[heading[1].length - 1]}`}><InlineText value={heading[2]} /></Heading>;
      }
      const lines = block.split('\n');
      if (lines.every((line) => /^[-*]\s+/.test(line))) return <ul key={index} className="list-disc space-y-2 pl-5">{lines.map((line, lineIndex) => <li key={lineIndex}><InlineText value={line.replace(/^[-*]\s+/, '')} /></li>)}</ul>;
      if (lines.every((line) => /^>\s?/.test(line))) return <blockquote key={index} className="border-l-2 border-primary pl-4 text-muted-foreground">{lines.map((line) => line.replace(/^>\s?/, '')).join(' ')}</blockquote>;
      return <p key={index}>{lines.map((line, lineIndex) => <React.Fragment key={lineIndex}><InlineText value={line} />{lineIndex < lines.length - 1 && <br />}</React.Fragment>)}</p>;
    })}
  </div>;
}
