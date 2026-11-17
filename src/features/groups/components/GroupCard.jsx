import { Users } from 'lucide-react';
import DiscoveryCard from '@/shared/components/DiscoveryCard.jsx';
import { groupImageValue, ratingStars, imageUrl } from '../model/groups.js';
export function GroupCard({ group, action, managementView = false }) {
  return (
    <DiscoveryCard
      href={`/groups/${group.id}${managementView ? '?manage=1' : ''}`}
      image={imageUrl(groupImageValue(group), 'group-covers')}
      icon={Users}
      badge={`${group.visibility || 'Public'} group`}
      title={group.name}
      footer={action}
    >
      <p className="mt-2 text-sm text-muted-foreground">
        Organized by {group.organizerName || 'YKCircle'}
      </p>
      <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Users aria-hidden="true" className="h-4 w-4 shrink-0" />
        {group.memberCount || 0} {Number(group.memberCount) === 1 ? 'member' : 'members'}
      </p>
      {group.description && (
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {group.description}
        </p>
      )}
      {Number(group.ratedEventCount) > 0 && (
        <p className="mt-auto pt-4 text-sm text-muted-foreground">
          <span className="text-primary" aria-hidden="true">
            {ratingStars(group.ratingAverage)}
          </span>{' '}
          {Number(group.ratingAverage).toFixed(1)} / 5 from {group.ratedEventCount} rated{' '}
          {Number(group.ratedEventCount) === 1 ? 'event' : 'events'}
        </p>
      )}
    </DiscoveryCard>
  );
}
