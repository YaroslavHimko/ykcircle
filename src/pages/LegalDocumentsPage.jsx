import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import { openCookieSettings } from "@/components/CookieSettings";
import SiteChrome from "@/components/SiteChrome";
import { apiFetch } from "@/lib/api";

const fallbackDocuments = [
  { slug: "terms", title: "Terms of Service" },
  { slug: "privacy", title: "Privacy Policy" },
  { slug: "community-guidelines", title: "Community Guidelines" },
  { slug: "cookies", title: "Cookie & Browser Storage Policy" },
];
const available = (slug) => fallbackDocuments.some(item => item.slug === slug);
const asDocuments = (data) => (Array.isArray(data) ? data : data?.documents || fallbackDocuments).filter(item => available(item.slug));
const safeHref = (href) => /^(https?:|mailto:)/i.test(href) ? href : null;

function InlineMarkdown({ text }) {
  return String(text).split(/(\[[^\]]+\]\([^\s)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    if (link) { const href = safeHref(link[2]); return href ? <a key={index} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="text-primary underline">{link[1]}</a> : <React.Fragment key={index}>{part}</React.Fragment>; }
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded bg-secondary px-1 py-0.5">{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

const tableCells = (line) => String(line).trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
const isTableRow = (line) => /^\s*\|?.+\|.+\|?\s*$/.test(line);
const isTableDivider = (line) => isTableRow(line) && tableCells(line).every((cell) => /^:?-{3,}:?$/.test(cell));

function MarkdownContent({ content }) {
  const nodes = []; let paragraph = []; let list = null; let code = null;
  const flushParagraph = () => { if (!paragraph.length) return; const lines = paragraph; paragraph = []; nodes.push(<p key={`paragraph-${nodes.length}`}>{lines.map((line, index) => <React.Fragment key={index}><InlineMarkdown text={line.replace(/^>\s?/, "")} />{index < lines.length - 1 && <br />}</React.Fragment>)}</p>); };
  const flushList = () => { if (!list) return; const { ordered, items } = list; list = null; const Tag = ordered ? "ol" : "ul"; nodes.push(<Tag key={`list-${nodes.length}`} className={ordered ? "list-decimal space-y-2 pl-6" : "list-disc space-y-2 pl-6"}>{items.map((item, index) => <li key={index}><InlineMarkdown text={item} /></li>)}</Tag>); };
  const lines = String(content || "").replace(/\r\n/g, "\n").split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith("```")) {
      flushParagraph(); flushList();
      if (code) { nodes.push(<pre key={`code-${nodes.length}`} className="overflow-x-auto border border-border bg-secondary/40 p-4 text-sm leading-relaxed"><code>{code.join("\n")}</code></pre>); code = null; } else code = [];
      continue;
    }
    if (code) { code.push(line); continue; }
    if (isTableRow(line) && isTableDivider(lines[index + 1])) {
      flushParagraph(); flushList();
      const headers = tableCells(line); const rows = [];
      index += 1;
      while (isTableRow(lines[index + 1]) && !isTableDivider(lines[index + 1])) rows.push(tableCells(lines[++index]));
      nodes.push(<div key={`table-${nodes.length}`} className="overflow-x-auto border border-border"><table className="min-w-full text-left text-sm"><thead className="bg-secondary/40"><tr>{headers.map((header, cellIndex) => <th key={cellIndex} scope="col" className="border-b border-border px-4 py-3 font-semibold"><InlineMarkdown text={header} /></th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-border last:border-0">{headers.map((_, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-top"><InlineMarkdown text={row[cellIndex] || ""} /></td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { flushParagraph(); flushList(); const Tag = `h${heading[1].length}`; const classes = ["font-display text-4xl font-black", "mt-10 font-display text-3xl font-semibold", "mt-8 font-display text-2xl font-semibold"]; nodes.push(<Tag key={`heading-${nodes.length}`} className={classes[heading[1].length - 1]}><InlineMarkdown text={heading[2]} /></Tag>); continue; }
    const unordered = line.match(/^[-*]\s+(.+)$/); const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) { flushParagraph(); const isOrdered = Boolean(ordered); if (!list || list.ordered !== isOrdered) { flushList(); list = { ordered: isOrdered, items: [] }; } list.items.push((unordered || ordered)[1]); continue; }
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    flushList(); paragraph.push(line);
  }
  if (code) nodes.push(<pre key={`code-${nodes.length}`} className="overflow-x-auto border border-border bg-secondary/40 p-4 text-sm leading-relaxed"><code>{code.join("\n")}</code></pre>);
  flushParagraph(); flushList();
  return <div className="mt-8 space-y-5 leading-relaxed">{nodes}</div>;
}

export default function LegalDocumentsPage({ documentSlug }) {
  const { slug: routeSlug } = useParams(); const slug = documentSlug || routeSlug; const [documents, setDocuments] = useState(fallbackDocuments); const [document, setDocument] = useState(null); const [error, setError] = useState("");
  useEffect(() => { apiFetch("/api/legal-documents").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }).then((data) => setDocuments(asDocuments(data))).catch(() => {}); }, []);
  useEffect(() => { if (!slug) return; setDocument(null); setError(""); if (!available(slug)) { setError("This document is not available during free early access."); return; } apiFetch(`/api/legal-documents/${encodeURIComponent(slug)}`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Legal document not found."); return data; }).then(setDocument).catch((requestError) => setError(requestError.message)); }, [slug]);
  return <SiteChrome><Helmet>{slug && !available(slug) && <meta name="robots" content="noindex" />}<title>{document?.title || (slug ? "Legal document" : "Legal documents")} | YKCircle</title></Helmet><section className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><p className="text-xs uppercase tracking-[0.3em] text-primary">Legal</p>{slug === "cookies" && <button type="button" onClick={openCookieSettings} className="ui-action mt-5 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-medium hover:border-primary">Manage cookie settings</button>}{!slug ? <><h1 className="mt-3 font-display text-5xl font-black">Legal documents</h1><p className="mt-5 max-w-2xl text-muted-foreground">Read YKCircle’s public policies, marketplace information, and terms.</p><nav aria-label="Legal documents" className="mt-10 divide-y border-y border-border">{documents.map((item) => <Link key={item.slug} to={`/${item.slug}`} className="flex min-h-16 items-center justify-between gap-4 py-4 text-lg hover:text-primary"><span>{item.title}</span><span aria-hidden="true">→</span></Link>)}</nav></> : <>{document && <article><h1 className="mt-3 font-display text-5xl font-black">{document.title}</h1><dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground"><div><dt className="inline">Last updated: </dt><dd className="inline">{document.lastUpdated || "Not stated"}</dd></div><div><dt className="inline">Current version: </dt><dd className="inline">{document.version}</dd></div></dl><MarkdownContent content={document.content} /></article>}{error && <p role="alert" className="mt-6 text-destructive">{error}</p>}{!document && !error && <p className="mt-8 text-muted-foreground">Loading document…</p>}<Link to="/legal" className="mt-12 inline-block text-sm text-primary underline">Back to legal documents</Link></>}</section></SiteChrome>;
}
