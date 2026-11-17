import { useState } from 'react';
import { participantPictureUrl, personPicture } from '../model/event-detail.js';
export function ParticipantAvatar({ person, className = '' }) {
  const picture = personPicture(person);
  const [failed, setFailed] = useState(false);
  const avatarClass = `participant-avatar inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full object-cover ${className}`;
  if (picture && !failed) {
    return (
      <img
        src={participantPictureUrl(picture)}
        alt=""
        className={avatarClass}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className={`${avatarClass} bg-secondary text-lg`} aria-hidden="true">
      {person?.name?.charAt(0)?.toUpperCase() || '?'}
    </span>
  );
}
