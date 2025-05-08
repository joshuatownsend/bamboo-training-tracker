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
import BambooTroubleshooting from "./pages/BambooTroubleshooting";
import NotFound from "./pages/NotFound";
import Layout from "./components/layout/Layout";
import BambooTroubleshootingDetail from "./pages/BambooTroubleshootingDetail";

function App() {
  return (
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
          <Route path="bamboo-troubleshooting" element={<BambooTroubleshooting />} />
          <Route path="bamboo-diagnostics" element={<BambooTroubleshootingDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
