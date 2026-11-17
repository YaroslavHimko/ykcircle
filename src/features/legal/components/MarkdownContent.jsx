import React from 'react';
import { safeHref, tableCells, isTableRow, isTableDivider } from '../model/legal-documents.js';
export function InlineMarkdown({ text }) {
  return String(text)
    .split(/(\[[^\]]+\]\([^\s)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
    .map((part, index) => {
      const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
      if (link) {
        const href = safeHref(link[2]);
        return href ? (
          <a
            key={index}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noreferrer' : undefined}
            className="text-primary underline"
          >
            {link[1]}
          </a>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        );
      }
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('`') && part.endsWith('`'))
        return (
          <code key={index} className="rounded bg-secondary px-1 py-0.5">
            {part.slice(1, -1)}
          </code>
        );
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={index}>{part.slice(1, -1)}</em>;
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
}
export function MarkdownContent({ content }) {
  const nodes = [];
  let paragraph = [];
  let list = null;
  let code = null;
  const flushParagraph = () => {
    if (!paragraph.length) return;
    const lines = paragraph;
    paragraph = [];
    nodes.push(
      <p key={`paragraph-${nodes.length}`}>
        {lines.map((line, index) => (
          <React.Fragment key={index}>
            <InlineMarkdown text={line.replace(/^>\s?/, '')} />
            {index < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>,
    );
  };
  const flushList = () => {
    if (!list) return;
    const { ordered, items } = list;
    list = null;
    const Tag = ordered ? 'ol' : 'ul';
    nodes.push(
      <Tag
        key={`list-${nodes.length}`}
        className={ordered ? 'list-decimal space-y-2 pl-6' : 'list-disc space-y-2 pl-6'}
      >
        {items.map((item, index) => (
          <li key={index}>
            <InlineMarkdown text={item} />
          </li>
        ))}
      </Tag>,
    );
  };
  const lines = String(content || '')
    .replace(/\r\n/g, '\n')
    .split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith('```')) {
      flushParagraph();
      flushList();
      if (code) {
        nodes.push(
          <pre
            key={`code-${nodes.length}`}
            className="overflow-x-auto border border-border bg-secondary/40 p-4 text-sm leading-relaxed"
          >
            <code>{code.join('\n')}</code>
          </pre>,
        );
        code = null;
      } else code = [];
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }
    if (isTableRow(line) && isTableDivider(lines[index + 1])) {
      flushParagraph();
      flushList();
      const headers = tableCells(line);
      const rows = [];
      index += 1;
      while (isTableRow(lines[index + 1]) && !isTableDivider(lines[index + 1]))
        rows.push(tableCells(lines[++index]));
      nodes.push(
        <div key={`table-${nodes.length}`} className="overflow-x-auto border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-secondary/40">
              <tr>
                {headers.map((header, cellIndex) => (
                  <th
                    key={cellIndex}
                    scope="col"
                    className="border-b border-border px-4 py-3 font-semibold"
                  >
                    <InlineMarkdown text={header} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border last:border-0">
                  {headers.map((_, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 align-top">
                      <InlineMarkdown text={row[cellIndex] || ''} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const Tag = `h${heading[1].length}`;
      const classes = [
        'font-display text-4xl font-black',
        'mt-10 font-display text-3xl font-semibold',
        'mt-8 font-display text-2xl font-semibold',
      ];
      nodes.push(
        <Tag key={`heading-${nodes.length}`} className={classes[heading[1].length - 1]}>
          <InlineMarkdown text={heading[2]} />
        </Tag>,
      );
      continue;
    }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = {
          ordered: isOrdered,
          items: [],
        };
      }
      list.items.push((unordered || ordered)[1]);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  if (code)
    nodes.push(
      <pre
        key={`code-${nodes.length}`}
        className="overflow-x-auto border border-border bg-secondary/40 p-4 text-sm leading-relaxed"
      >
        <code>{code.join('\n')}</code>
      </pre>,
    );
  flushParagraph();
  flushList();
  return <div className="mt-8 space-y-5 leading-relaxed">{nodes}</div>;
}
