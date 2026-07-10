import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { NewEvaluation } from './pages/NewEvaluation';
import { ThemeToggle } from './components/ThemeToggle';

function PrivateRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
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
        <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 1000 }}>
          <ThemeToggle />
        </div>
        <Routes>
          <Route path="/login" element={<Login />} />
          
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
            <PrivateRoute roles={['evaluator', 'ghost']}>
              <NewEvaluation />
            </PrivateRoute>
          } />
          
          <Route path="/" element={<DefaultRoute />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
