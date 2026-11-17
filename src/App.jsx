import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { Layout } from './components/Layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { HREmployeesPage } from './pages/HREmployeesPage';
import { HRAttendancePage } from './pages/HRAttendancePage';
import { HRCompanyRequestsPage } from './pages/HRCompanyRequestsPage';
import { HolidaysPage } from './pages/HolidaysPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminApprovalsPage } from './pages/AdminApprovalsPage';
import { SuperAdminRequestsPage } from './components/SuperAdmin/SuperAdminRequestsPage';
import { SuperAdminReportsPage } from './components/SuperAdmin/SuperAdminReportsPage';
import { SuperAdminSettings } from './components/SuperAdmin/SuperAdminSettings';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, currentUser, isHR, isSuperAdmin, loading, error } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Whenever user changes or signs in, reset to appropriate initial tab
  useEffect(() => {
    if (currentUser) {
      setCurrentTab('dashboard');
    }
  }, [currentUser?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-black tracking-wider uppercase text-black">
            Initializing KNOOVIQ Workforce Attendance...
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, render the secure Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="p-6 bg-white rounded-2xl border border-rose-300 shadow-xl max-w-md text-center">
          <p className="text-black font-black mb-2">Authentication Error</p>
          <p className="text-xs text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white border-2 border-blue-600 text-black rounded-xl text-xs font-black hover:bg-blue-50"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    const companyTabs = ['hr-employees', 'hr-attendance', 'hr-company-requests'];
    const adminTabs = ['admin', 'office-location', 'admin-approvals'];
    if ((companyTabs.includes(currentTab) && !isHR && !isSuperAdmin) ||
        (adminTabs.includes(currentTab) && !isSuperAdmin)) {
      return <p role="alert">You do not have access to this page.</p>;
    }
    switch (currentTab) {
      case 'admin':
        return <SuperAdminSettings setTab={setCurrentTab} />;
      case 'dashboard':
        return <DashboardPage setTab={setCurrentTab} />;
      case 'calendar':
        return <CalendarPage />;
      case 'my-requests':
        return isSuperAdmin ? <SuperAdminRequestsPage /> : <MyRequestsPage />;
      case 'hr-employees':
        return <HREmployeesPage />;
      case 'hr-attendance':
        return isSuperAdmin ? <SuperAdminReportsPage /> : <HRAttendancePage />;
      case 'hr-company-requests':
        return <HRCompanyRequestsPage />;
      case 'holidays':
        return <HolidaysPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'office-location':
        return <SuperAdminSettings setTab={setCurrentTab} />;
      case 'admin-approvals':
        return <AdminApprovalsPage />;
      default:
        return <DashboardPage setTab={setCurrentTab} />;
    }
  };

  return (
    <Layout currentTab={currentTab} setTab={setCurrentTab}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <div className="app-blue-white">
      <AuthProvider>
        <NotificationsProvider>
          <AppContent />
        </NotificationsProvider>
      </AuthProvider>
    </div>
  );
}
