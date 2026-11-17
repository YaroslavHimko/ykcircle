import { Route, Navigate } from 'react-router-dom';
import HomePage from '@/features/marketing/pages/HomePage.jsx';
import AboutPage from '@/features/marketing/pages/AboutPage.jsx';
import JoinPage from '@/features/marketing/pages/JoinPage.jsx';
export const marketingRoutes = [
  <Route key="/" path="/" element={<HomePage />} />,
  <Route key="/about" path="/about" element={<AboutPage />} />,
  <Route key="/join" path="/join" element={<JoinPage />} />,
  <Route key="/company" path="/company" element={<Navigate to="/operator" replace />} />,
];
