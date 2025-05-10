
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from "./pages/Login";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import Courses from "./pages/Courses";
import MyTrainings from "./pages/MyTrainings";
import MyQualifications from "./pages/MyQualifications";
import RequiredTrainings from "./pages/RequiredTrainings";
import AdminSettings from "./pages/AdminSettings";
import AdminReports from "./pages/AdminReports";
import PositionManagement from "./pages/PositionManagement";
import TrainingRequirementManagement from "./pages/TrainingRequirementManagement";
import TrainingImpact from "./pages/TrainingImpact";
import TrainingDataValidation from "./pages/TrainingDataValidation";
import BambooTroubleshooting from "./pages/BambooTroubleshooting";
import BambooTroubleshootingDetail from "./pages/BambooTroubleshootingDetail";
import BambooConnectionTest from "./pages/BambooConnectionTest";
import NotFound from "./pages/NotFound";
import Layout from "./components/layout/Layout";
import { UserProvider } from './contexts/UserContext';
import { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { prefetchBambooHRData } from '@/services/dataCacheService';

// Initialize the query client at the app level
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (replaces cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  // Start background refresh when the app loads
  useEffect(() => {
    // Run the first prefetch when the app loads
    prefetchBambooHRData();
    
    // Set up periodic refresh (every 5 minutes)
    const intervalId = setInterval(() => {
      console.log("Running background refresh of BambooHR data");
      prefetchBambooHRData();
    }, 5 * 60 * 1000);
    
    // Return cleanup function
    return () => {
      console.log("Stopping background refresh");
      clearInterval(intervalId);
    };
  }, []);

  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
            <Route path="courses" element={<Courses />} />
            <Route path="my-trainings" element={<MyTrainings />} />
            <Route path="my-qualifications" element={<MyQualifications />} />
            <Route path="required-trainings" element={<RequiredTrainings />} />
            <Route path="admin-settings" element={<AdminSettings />} />
            <Route path="admin-reports" element={<AdminReports />} />
            <Route path="position-management" element={<PositionManagement />} />
            <Route path="training-requirement-management" element={<TrainingRequirementManagement />} />
            <Route path="training-impact" element={<TrainingImpact />} />
            <Route path="training-validation" element={<TrainingDataValidation />} />
            <Route path="bamboo-troubleshooting" element={<BambooTroubleshooting />} />
            <Route path="bamboo-diagnostics" element={<BambooTroubleshootingDetail />} />
            <Route path="bamboo-test" element={<BambooConnectionTest />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
