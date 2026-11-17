import { eventImageRenderDebug } from '@/shared/media/media.js';
import { eventCover } from '../model/event-form.js';
export const EventCoverImage = ({ event, className, alt = '', component }) => {
  const src = eventCover(event);
  if (!src) return null;
  eventImageRenderDebug({
    component,
    event,
  });
  return <img src={src} alt={alt} className={className} />;
};
