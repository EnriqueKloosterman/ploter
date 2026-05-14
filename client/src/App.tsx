import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Dashboard from './components/Dashboard/Dashboard';
import Workspace from './Workspace';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/project/:projectId" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
