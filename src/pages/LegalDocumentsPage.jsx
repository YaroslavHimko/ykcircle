import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import SiteChrome from "@/components/SiteChrome";
import { apiFetch } from "@/lib/api";

const fallbackDocuments = [
  { slug: "privacy", title: "Privacy Policy" }, { slug: "terms", title: "Terms of Service" },
  { slug: "organizer-terms", title: "Organizer Terms" },
  { slug: "tickets-refunds", title: "Tickets & Refunds" }, { slug: "cookies", title: "Cookie Policy" },
];
const asDocuments = (data) => Array.isArray(data) ? data : data?.documents || fallbackDocuments;
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

function MarkdownContent({ content }) {
  return <div className="mt-8 space-y-5 leading-relaxed">{String(content || "").replace(/\r\n/g, "\n").split(/\n\s*\n/).map((block, index) => {
    const lines = block.split("\n"); const heading = lines.length === 1 && lines[0].match(/^(#{1,3})\s+(.+)$/);
    if (heading) { const Tag = `h${heading[1].length}`; const classes = ["font-display text-4xl font-black", "mt-10 font-display text-3xl font-semibold", "mt-8 font-display text-2xl font-semibold"]; return <Tag key={index} className={classes[heading[1].length - 1]}><InlineMarkdown text={heading[2]} /></Tag>; }
    if (lines.every((line) => /^[-*]\s+/.test(line))) return <ul key={index} className="list-disc space-y-2 pl-6">{lines.map((line, lineIndex) => <li key={lineIndex}><InlineMarkdown text={line.replace(/^[-*]\s+/, "")} /></li>)}</ul>;
    if (lines.every((line) => /^\d+\.\s+/.test(line))) return <ol key={index} className="list-decimal space-y-2 pl-6">{lines.map((line, lineIndex) => <li key={lineIndex}><InlineMarkdown text={line.replace(/^\d+\.\s+/, "")} /></li>)}</ol>;
    return <p key={index}>{lines.map((line, lineIndex) => <React.Fragment key={lineIndex}><InlineMarkdown text={line.replace(/^>\s?/, "")} />{lineIndex < lines.length - 1 && <br />}</React.Fragment>)}</p>;
  })}</div>;
}

export default function LegalDocumentsPage({ documentSlug }) {
  const { slug: routeSlug } = useParams(); const slug = documentSlug || routeSlug; const [documents, setDocuments] = useState(fallbackDocuments); const [document, setDocument] = useState(null); const [error, setError] = useState("");
  useEffect(() => { apiFetch("/api/legal-documents").then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }).then((data) => setDocuments(asDocuments(data))).catch(() => {}); }, []);
  useEffect(() => { if (!slug) return; setDocument(null); setError(""); apiFetch(`/api/legal-documents/${encodeURIComponent(slug)}`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Legal document not found."); return data; }).then(setDocument).catch((requestError) => setError(requestError.message)); }, [slug]);
  return <SiteChrome><Helmet><title>{document?.title || (slug ? "Legal document" : "Legal documents")} | YKCircle</title></Helmet><section className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><p className="text-xs uppercase tracking-[0.3em] text-primary">Legal</p>{!slug ? <><h1 className="mt-3 font-display text-5xl font-black">Legal documents</h1><p className="mt-5 max-w-2xl text-muted-foreground">Read YKCircle’s public policies and terms.</p><div className="mt-10 divide-y border-y border-border">{documents.map((item) => <Link key={item.slug} to={`/legal/${item.slug}`} className="flex min-h-16 items-center justify-between gap-4 py-4 text-lg hover:text-primary"><span>{item.title}</span><span aria-hidden="true">→</span></Link>)}</div></> : <>{document && <><h1 className="mt-3 font-display text-5xl font-black">{document.title}</h1><p className="mt-4 text-sm text-muted-foreground">Last updated: {document.lastUpdated}</p><p className="mt-5 border border-amber-500/50 bg-amber-500/10 p-4 text-sm">This document is a draft template in development. No real data is provided yet. Company, contact, and date placeholders must be completed and legally reviewed in Sweden before production use.</p><MarkdownContent content={document.content} /></>}{error && <p role="alert" className="mt-6 text-destructive">{error}</p>}{!document && !error && <p className="mt-8 text-muted-foreground">Loading document…</p>}<Link to="/legal" className="mt-12 inline-block text-sm text-primary underline">Back to legal documents</Link></>}</section></SiteChrome>;
}
