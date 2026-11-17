import { eventImageRenderDebug } from '@/shared/media/media.js';
import { eventImageValue } from '../model/groups.js';
export const EventImage = ({ event, className, component }) => {
  const src = eventImageValue(event);
  if (!src) return null;
  eventImageRenderDebug({
    component,
    event,
  });
  return <img src={src} alt="" className={className} />;
};
