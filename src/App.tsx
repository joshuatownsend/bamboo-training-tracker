import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster"
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Courses from './pages/Courses';
import MyTrainings from './pages/MyTrainings';
import RequiredTrainings from './pages/RequiredTrainings';
import AdminSettings from './pages/AdminSettings';
import Login from './pages/Login';
import UserProvider from './contexts/UserContext';
import MsalProvider from './contexts/MsalContext';
import AuthGuard from './components/auth/AuthGuard';
import BambooTest from './pages/BambooTest';
import TrainingDataValidation from './pages/TrainingDataValidation';
import BambooTroubleshooting from './pages/BambooTroubleshooting';
import BambooApiDiagnostics from './pages/BambooApiDiagnostics';

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to /login if the user tries to access any route without being authenticated
    const publicRoutes = ['/login'];
    const isPublicRoute = publicRoutes.includes(location.pathname);

    // You can add more sophisticated authentication checks here if needed
    // For example, checking if the user is logged in or has a valid token

    // If the route is not a public route, redirect to /login
    if (!isPublicRoute) {
      // You might want to store the intended route in localStorage or a cookie
      // so you can redirect the user back to it after they log in.
      // localStorage.setItem('intendedRoute', location.pathname);
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <MsalProvider>
        <UserProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/employees" element={<AuthGuard><Employees /></AuthGuard>} />
            <Route path="/courses" element={<AuthGuard><Courses /></AuthGuard>} />
            <Route path="/my-trainings" element={<AuthGuard><MyTrainings /></AuthGuard>} />
            <Route path="/required-trainings" element={<AuthGuard><RequiredTrainings /></AuthGuard>} />
            <Route path="/admin-settings" element={<AuthGuard><AdminSettings /></AuthGuard>} />
            <Route path="/training-validation" element={<AuthGuard><TrainingDataValidation /></AuthGuard>} />
            <Route path="/bamboo-test" element={<AuthGuard><BambooTest /></AuthGuard>} />
            <Route path="/bamboo-troubleshooting" element={<AuthGuard><BambooTroubleshooting /></AuthGuard>} />
            <Route path="/bamboo-diagnostics" element={<AuthGuard><BambooApiDiagnostics /></AuthGuard>} />
          </Routes>
        </UserProvider>
      </MsalProvider>
      <Toaster />
    </div>
  );
}

export default App;
