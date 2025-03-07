import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useColorMode } from '@chakra-ui/react';
import { ToastContainer } from 'react-toastify';
import { useAuth } from './contexts/AuthContext';

// Layout components
import Layout from './components/layout/Layout';
import Chatbot from './components/Chatbot';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import AIAnalysis from './pages/AIAnalysis';
import TelemetryData from './pages/TelemetryData';
import AnalysisDetails from './pages/AnalysisDetails';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => {
  const { user } = useAuth();
  const { colorMode, setColorMode } = useColorMode();
  
  // Set dark mode based on user preferences
  useEffect(() => {
    if (user?.settings?.darkMode && colorMode !== 'dark') {
      setColorMode('dark');
    } else if (!user?.settings?.darkMode && colorMode !== 'light') {
      setColorMode('light');
    }
  }, [user, colorMode, setColorMode]);
  
  // Apply dark mode class to body for custom styling
  useEffect(() => {
    if (colorMode === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [colorMode]);

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={colorMode}
      />
      
      {/* Chatbot is available on all pages */}
      <Chatbot />
      
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/resetpassword/:resetToken" element={<ResetPassword />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/telemetry" element={
          <ProtectedRoute>
            <Layout>
              <TelemetryData />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/analysis" element={
          <ProtectedRoute>
            <Layout>
              <AIAnalysis />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/analysis/:id" element={
          <ProtectedRoute>
            <Layout>
              <AnalysisDetails />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Not found route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
