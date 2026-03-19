import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Public pages
import LoginPage from './pages/LoginPage';

// Admin
import AdminLayout from './admin/layouts/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import MembersPage from './admin/pages/MembersPage';
import ActivitiesPage from './admin/pages/ActivitiesPage';
import NewsPage from './admin/pages/NewsPage';
import CreateNewsPage from './admin/pages/CreateNewsPage';
import EditNewsPage from './admin/pages/EditNewsPage';
import NewsDetailPage from './admin/pages/NewsDetailPage';
import QuizPage from './admin/pages/QuizPage';
import CreateQuizPage from './admin/pages/CreateQuizPage';
import EditQuizPage from './admin/pages/EditQuizPage';
import MeetingsPage from './admin/pages/MeetingsPage';
import DocumentsPage from './admin/pages/DocumentsPage';
import NotificationsPage from './admin/pages/NotificationsPage';
import UsersPage from './admin/pages/UsersPage';
import BannersPage from './admin/pages/BannersPage';
import BranchesPage from './admin/pages/BranchesPage';
import CellsPage from './admin/pages/CellsPage';
import LandingSettingsPage from './admin/pages/LandingSettingsPage';
import LocationsPage from './admin/pages/LocationsPage';
import ActivityParticipantsPage from './admin/pages/ActivityParticipantsPage';
import MeetingAttendancePage from './admin/pages/MeetingAttendancePage';
import FeesPage from './admin/pages/FeesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 }
  }
});

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/admin" replace /> : <LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="news/create" element={<CreateNewsPage />} />
        <Route path="news/edit/:id" element={<EditNewsPage />} />
        <Route path="news/view/:id" element={<NewsDetailPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="quiz/create" element={<CreateQuizPage />} />
        <Route path="quiz/edit/:id" element={<EditQuizPage />} />
        <Route path="meetings" element={<MeetingsPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="banners" element={<BannersPage />} />
        <Route path="branches" element={<BranchesPage />} />
        <Route path="cells" element={<CellsPage />} />
        <Route path="landing" element={<LandingSettingsPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="activities/:id/participants" element={<ActivityParticipantsPage />} />
        <Route path="meetings/:id/attendance" element={<MeetingAttendancePage />} />
      </Route>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
