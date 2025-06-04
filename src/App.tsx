import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardRoot from './pages/dashboard';
import DashboardHome from './pages/dashboard/home';
import ProjectsPage from './pages/dashboard/projects/ProjectDashboard';
import NewProject from './pages/dashboard/projects/NewProject';
import ProjectDetails from './pages/dashboard/projects/ProjectDetails';
import EditProject from './pages/dashboard/projects/EditProject';
import CatalogPage from './pages/dashboard/catalog';
import ClientsPage from './pages/dashboard/clients';
import CommunityPage from './pages/dashboard/community';
import LandingPage from './pages/landing';
import AdminDashboard from './pages/admin/AdminDashboard';

// Protected route component with role check
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  allowedRoles?: string[];
  requireOwnership?: boolean;
  resourceId?: string;
}> = ({ children, allowedRoles, requireOwnership, resourceId }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" />;
  }

  // Additional check for resource ownership if required
  if (requireOwnership && resourceId) {
    // You can implement specific ownership checks here
    // For now, we'll let the RLS policies handle this
    return <>{children}</>;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { profile } = useAuth();

  // Redirect to appropriate dashboard based on role
  const handleDashboardRedirect = () => {
    if (profile?.role === 'admin' || profile?.role === 'superadmin') {
      return <Navigate to="/admin" />;
    }
    return <Navigate to="/dashboard" />;
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      
      {/* Regular user routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardRoot />
          </ProtectedRoute>
        } 
      >
        <Route index element={<DashboardHome />} />
        <Route path="projects">
          <Route index element={<ProjectsPage />} />
          <Route path="new" element={<NewProject />} />
          <Route path=":id" element={<ProjectDetails />} />
          <Route 
            path=":id/edit" 
            element={
              <ProtectedRoute requireOwnership>
                <EditProject />
              </ProtectedRoute>
            } 
          />
        </Route>
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="community" element={<CommunityPage />} />
      </Route>

      {/* Admin routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Default redirect based on role */}
      <Route path="*" element={handleDashboardRedirect()} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-white text-gray-900">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;