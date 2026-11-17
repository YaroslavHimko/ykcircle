import { apiAssetUrl } from '@/shared/api/client.js';
import { eventMediaUrl } from '@/shared/media/media.js';
export const managementRoles = ['organizer', 'manager', 'admin'];
export const asList = (data, key = 'groups') => (Array.isArray(data) ? data : data?.[key] || []);
// coverImageUrl carries a signed token for a private group's cover, so it
// must win over the bare coverImage filename, which has no token attached.

export // coverImageUrl carries a signed token for a private group's cover, so it
// must win over the bare coverImage filename, which has no token attached.
const groupImageValue = (group) =>
  group?.coverImageUrl ||
  group?.coverImage ||
  group?.image ||
  group?.imageUrl ||
  group?.groupImage ||
  group?.groupImageUrl ||
  '';
export const eventImageValue = eventMediaUrl;
export const ratingStars = (rating) => {
  const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
};
export const imageUrl = (value, folder) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('/images/')) return value;
  if (value.startsWith('/uploads/')) return apiAssetUrl(value);
  if (value.startsWith(`${folder}/`)) return apiAssetUrl(`/uploads/${value}`);
  return apiAssetUrl(value.startsWith('/') ? value : `/uploads/${folder}/${value}`);
};
