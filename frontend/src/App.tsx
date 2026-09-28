import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './layouts/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import { Login } from './pages/Login';
import { HomePage } from './pages/HomePage';
import { OperatorDashboard } from './pages/OperatorDashboard';
import { BatchUpload } from './pages/BatchUpload';
import { DocumentReview } from './pages/DocumentReview';
import { OfficerQueue } from './pages/OfficerQueue';
import { OfficerReview } from './pages/OfficerReview';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminAudit } from './pages/AdminAudit';
import { AdminGIS } from './pages/AdminGIS';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Home & Login Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Operator Routes */}
            <Route
              path="/operator"
              element={
                <ProtectedRoute allowedRoles={['operator', 'admin']}>
                  <OperatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operator/upload"
              element={
                <ProtectedRoute allowedRoles={['operator', 'admin']}>
                  <BatchUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operator/review/:documentId"
              element={
                <ProtectedRoute allowedRoles={['operator', 'admin']}>
                  <DocumentReview />
                </ProtectedRoute>
              }
            />

            {/* Officer Routes */}
            <Route
              path="/officer"
              element={
                <ProtectedRoute allowedRoles={['officer', 'admin']}>
                  <OfficerQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/review/:documentId"
              element={
                <ProtectedRoute allowedRoles={['officer', 'admin']}>
                  <OfficerReview />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAudit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/gis"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminGIS />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
