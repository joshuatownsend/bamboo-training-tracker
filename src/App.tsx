
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster"
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Courses from './pages/Courses';
import MyTrainings from './pages/MyTrainings';
import RequiredTrainings from './pages/RequiredTrainings';
import AdminSettings from './pages/AdminSettings';
import Login from './pages/Login';
import UserProvider from './contexts/UserContext';
import AuthGuard from './components/auth/AuthGuard';
import BambooTest from './pages/BambooTest';
import TrainingDataValidation from './pages/TrainingDataValidation';
import BambooTroubleshooting from './pages/BambooTroubleshooting';
import BambooApiDiagnostics from './pages/BambooApiDiagnostics';
import Layout from './components/layout/Layout';
import MyQualifications from './pages/MyQualifications';
import AdminReports from './pages/AdminReports';
import PositionManagement from './pages/PositionManagement';
import TrainingImpact from './pages/TrainingImpact';
import QualificationsReport from './pages/reports/QualificationsReport';
import EligibilityReport from './pages/reports/EligibilityReport';
import RequirementsReport from './pages/reports/RequirementsReport';
import ComplianceReport from './pages/reports/ComplianceReport';
import TrainingRequirementManagement from './pages/TrainingRequirementManagement';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <UserProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/employees" element={<AuthGuard><Employees /></AuthGuard>} />
            <Route path="/courses" element={<AuthGuard><Courses /></AuthGuard>} />
            <Route path="/my-trainings" element={<AuthGuard><MyTrainings /></AuthGuard>} />
            <Route path="/my-qualifications" element={<AuthGuard><MyQualifications /></AuthGuard>} />
            <Route path="/required-trainings" element={<AuthGuard><RequiredTrainings /></AuthGuard>} />
            <Route path="/admin-settings" element={<AuthGuard><AdminSettings /></AuthGuard>} />
            <Route path="/training-validation" element={<AuthGuard><TrainingDataValidation /></AuthGuard>} />
            <Route path="/bamboo-test" element={<AuthGuard><BambooTest /></AuthGuard>} />
            <Route path="/bamboo-troubleshooting" element={<AuthGuard><BambooTroubleshooting /></AuthGuard>} />
            <Route path="/bamboo-diagnostics" element={<AuthGuard><BambooApiDiagnostics /></AuthGuard>} />
            
            {/* Reports section - accessible to all authenticated users */}
            <Route path="/admin-reports" element={<AuthGuard><AdminReports /></AuthGuard>} />
            <Route path="/training-impact" element={<AuthGuard><TrainingImpact /></AuthGuard>} />
            
            {/* Admin reports routes */}
            <Route path="/admin/reports/qualifications" element={<AuthGuard><QualificationsReport /></AuthGuard>} />
            <Route path="/admin/reports/eligibility" element={<AuthGuard><EligibilityReport /></AuthGuard>} />
            <Route path="/admin/reports/requirements" element={<AuthGuard><RequirementsReport /></AuthGuard>} />
            <Route path="/admin/reports/compliance" element={<AuthGuard><ComplianceReport /></AuthGuard>} />
            
            {/* Admin-only section */}
            <Route path="/position-management" element={<AuthGuard><PositionManagement /></AuthGuard>} />
            <Route path="/training-requirement-management" element={<AuthGuard><TrainingRequirementManagement /></AuthGuard>} />
          </Route>
        </Routes>
        <Toaster />
      </UserProvider>
    </div>
  );
}

export default App;
