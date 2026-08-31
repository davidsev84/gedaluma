import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { NewEvaluation } from './pages/NewEvaluation';
import { NewInventory } from './pages/NewInventory';
import { Logbook } from './pages/Logbook';
import { Landing } from './pages/Landing';
import { ThemeToggle } from './components/ThemeToggle';
import { Navbar } from './components/Navbar';

function PrivateRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

function DefaultRoute() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/evaluate" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="theme-toggle-container">
          <ThemeToggle />
        </div>
        <Navbar />
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Landing />} />
          
          <Route path="/login" element={<Login />} />
          
          {/* App routing decider */}
          <Route path="/app" element={<DefaultRoute />} />
          
          <Route path="/dashboard" element={
            <PrivateRoute roles={['admin']}>
              <Dashboard />
            </PrivateRoute>
          } />

          <Route path="/history" element={
            <PrivateRoute roles={['admin']}>
              <History />
            </PrivateRoute>
          } />
          
          <Route path="/evaluate" element={
            <PrivateRoute roles={['admin', 'evaluator', 'ghost']}>
              <NewEvaluation />
            </PrivateRoute>
          } />

          <Route path="/inventory/new" element={
            <PrivateRoute roles={['admin', 'evaluator', 'ghost']}>
              <NewInventory />
            </PrivateRoute>
          } />

          <Route path="/logbook" element={
            <PrivateRoute roles={['admin', 'evaluator']}>
              <Logbook />
            </PrivateRoute>
          } />
          
          <Route path="/evaluation/new" element={<Navigate to="/evaluate" replace />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
