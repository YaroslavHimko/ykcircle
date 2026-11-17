import { useParams } from 'react-router-dom';
import { PublicListing } from './PublicListing.jsx';
import { PublicArticle } from './PublicArticle.jsx';
import { EditorialWorkspace } from './EditorialWorkspace.jsx';
export function ArticlesPage({ view = 'list' }) {
  const { category } = useParams();
  if (view === 'detail') return <PublicArticle />;
  if (view === 'workspace' || view === 'new' || view === 'edit') {
    const workspaceView = view === 'workspace' ? 'list' : view;
    return <EditorialWorkspace key={workspaceView} view={workspaceView} />;
  }
  return <PublicListing categorySlug={category || ''} />;
}
export default ArticlesPage;
