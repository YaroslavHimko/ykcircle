export const editorRoles = ['customer', 'organizer', 'venue_owner', 'manager', 'admin'];
export const newArticle = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  categoryId: '',
  tags: [],
  status: 'draft',
  isIndexable: true,
  media: [],
};
export function readUser() {
  try {
    return JSON.parse(localStorage.getItem('authUser') || 'null');
  } catch {
    return null;
  }
}
