export const fallbackDocuments = [
  {
    slug: 'terms',
    title: 'Terms of Service',
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
  },
  {
    slug: 'community-guidelines',
    title: 'Community Guidelines',
  },
  {
    slug: 'cookies',
    title: 'Cookie & Browser Storage Policy',
  },
];
export const available = (slug) => fallbackDocuments.some((item) => item.slug === slug);
export const asDocuments = (data) =>
  (Array.isArray(data) ? data : data?.documents || fallbackDocuments).filter((item) =>
    available(item.slug),
  );
export const safeHref = (href) => (/^(https?:|mailto:)/i.test(href) ? href : null);
export const tableCells = (line) =>
  String(line)
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
export const isTableRow = (line) => /^\s*\|?.+\|.+\|?\s*$/.test(line);
export const isTableDivider = (line) =>
  isTableRow(line) && tableCells(line).every((cell) => /^:?-{3,}:?$/.test(cell));
