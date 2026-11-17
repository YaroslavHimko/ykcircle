import { groupImageValue, imageUrl } from '../model/groups.js';
export function GroupImage({ group, className = '' }) {
  const image = imageUrl(groupImageValue(group), 'group-covers');
  return image ? (
    <img src={image} alt="" className={`object-cover ${className}`} />
  ) : (
    <div className={`bg-gradient-to-br from-primary/90 via-primary/65 to-slate-900 ${className}`} />
  );
}
