import { Route } from 'react-router-dom';
import AuthPage from '@/features/auth/pages/AuthPage.jsx';
import CheckEmailPage from '@/features/auth/pages/CheckEmailPage.jsx';
import VerifyEmailPage from '@/features/auth/pages/VerifyEmailPage.jsx';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage.jsx';
import AccountDeletedPage from '@/features/auth/pages/AccountDeletedPage.jsx';
export const authRoutes = [
  <Route key="/login" path="/login" element={<AuthPage mode="login" />} />,
  <Route key="/register" path="/register" element={<AuthPage mode="register" />} />,
  <Route key="/check-email" path="/check-email" element={<CheckEmailPage />} />,
  <Route key="/verify-email" path="/verify-email" element={<VerifyEmailPage />} />,
  <Route key="/forgot-password" path="/forgot-password" element={<ForgotPasswordPage />} />,
  <Route key="/reset-password" path="/reset-password" element={<ResetPasswordPage />} />,
  <Route key="/account-deleted" path="/account-deleted" element={<AccountDeletedPage />} />,
];
