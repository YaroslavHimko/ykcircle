import { Route } from 'react-router-dom';
import ArticlesPage from '@/features/articles/pages/ArticlesPage.jsx';
export const articlesRoutes = [
  <Route
    key="/profile/articles"
    path="/profile/articles"
    element={<ArticlesPage view="workspace" />}
  />,
  <Route
    key="/profile/articles/new"
    path="/profile/articles/new"
    element={<ArticlesPage view="new" />}
  />,
  <Route
    key="/profile/articles/:id/edit"
    path="/profile/articles/:id/edit"
    element={<ArticlesPage view="edit" />}
  />,
  <Route
    key="/articles/category/:category"
    path="/articles/category/:category"
    element={<ArticlesPage />}
  />,
  <Route key="/articles/:slug" path="/articles/:slug" element={<ArticlesPage view="detail" />} />,
  <Route key="/articles" path="/articles" element={<ArticlesPage />} />,
];
