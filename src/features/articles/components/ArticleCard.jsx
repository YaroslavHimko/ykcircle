import DiscoveryCard from '@/shared/components/DiscoveryCard.jsx';
import { BookOpen, CalendarDays, UserRound } from 'lucide-react';
import { articleDate, articleImageUrl } from '../api/articles.js';
import { StatusBadge } from './StatusBadge.jsx';
export function ArticleCard({ article, editable = false }) {
  const href = editable ? `/profile/articles/${article.id}/edit` : `/articles/${article.slug}`;
  return (
    <DiscoveryCard
      href={href}
      image={articleImageUrl(article.coverImage)}
      imageAlt={article.coverAltText || ''}
      icon={BookOpen}
      badge={editable ? <StatusBadge status={article.status} /> : 'Free to read'}
      eyebrow={article.categoryName || 'YKCircle journal'}
      title={article.title}
    >
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {article.excerpt}
      </p>
      <div className="mt-auto space-y-2 pt-5 text-sm text-muted-foreground">
        {article.authorName && (
          <p className="flex items-center gap-2">
            <UserRound aria-hidden="true" className="h-4 w-4 shrink-0" />
            {article.authorName}
          </p>
        )}
        <p className="flex items-center gap-2">
          <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0" />
          {articleDate(article.publishedAt || article.updatedAt)}
        </p>
      </div>
    </DiscoveryCard>
  );
}
