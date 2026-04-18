import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import SiteLayout from './components/SiteLayout';
import AskQuestionPage from './pages/AskQuestionPage';
import AdminPanelPage from './pages/AdminPanelPage';
import DoctorLoginPage from './pages/DoctorLoginPage';
import CompletePatientPhonePage from './pages/CompletePatientPhonePage';
import DoctorCompleteProfilePage from './pages/DoctorCompleteProfilePage';
import DoctorPanelPage from './pages/DoctorPanelPage';
import DoctorSignupPage from './pages/DoctorSignupPage';
import { ForumCategoryPage } from './pages/ForumCategoryPage';
import { ForumQuestionDetailPage } from './pages/ForumQuestionDetailPage';
import HomePage from './pages/HomePage';
import MyDiscussionsPage from './pages/MyDiscussionsPage';

/** Old `/forum/diabetes/...` URLs → SEO slug `/forum/diabetes-management/...` */
function LegacyDiabetesForumRedirect() {
  const loc = useLocation();
  const to = loc.pathname.replace(/^\/forum\/diabetes(?=\/|$)/, '/forum/diabetes-management');
  return <Navigate to={`${to}${loc.search}${loc.hash}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Navigate to="/forum" replace />} />
          <Route path="/ask" element={<Navigate to="/forum/ask" replace />} />
          <Route path="/my-discussions" element={<Navigate to="/forum/my-discussions" replace />} />
          <Route path="/doctor/panel" element={<Navigate to="/forum/doctor/panel" replace />} />
          <Route path="/admin/panel" element={<Navigate to="/forum/admin/panel" replace />} />
          <Route path="/doctor-signup" element={<Navigate to="/forum/doctor-signup" replace />} />
          <Route path="/doctor-login" element={<Navigate to="/forum/doctor-login" replace />} />
          <Route path="/forum" element={<HomePage />} />
          <Route path="/forum/ask" element={<AskQuestionPage />} />
          <Route path="/forum/my-discussions" element={<MyDiscussionsPage />} />
          <Route path="/forum/doctor/panel" element={<DoctorPanelPage />} />
          <Route path="/forum/admin/panel" element={<AdminPanelPage />} />
          <Route path="/forum/doctor-signup" element={<DoctorSignupPage />} />
          <Route path="/forum/doctor-login" element={<DoctorLoginPage />} />
          <Route path="/forum/complete-phone" element={<CompletePatientPhonePage />} />
          <Route path="/forum/doctor/complete-profile" element={<DoctorCompleteProfilePage />} />
          <Route path="/forum/diabetes/*" element={<LegacyDiabetesForumRedirect />} />
          <Route path="/forum/:categorySlug" element={<ForumCategoryPage />} />
          <Route path="/forum/:categorySlug/question/:questionId" element={<ForumQuestionDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
