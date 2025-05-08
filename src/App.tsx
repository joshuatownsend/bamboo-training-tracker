
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Index from "./pages/Index";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import Courses from "./pages/Courses";
import NotFound from "./pages/NotFound";
import MyTrainings from "./pages/MyTrainings";
import MyQualifications from "./pages/MyQualifications";
import RequiredTrainings from "./pages/RequiredTrainings";
import AdminReports from "./pages/AdminReports";
import PositionManagement from "./pages/PositionManagement";
import TrainingImpact from "./pages/TrainingImpact";
import TrainingRequirementManagement from "./pages/TrainingRequirementManagement";
import AdminSettings from "./pages/AdminSettings";
import UserProvider from "./contexts/UserContext";
import MsalContextProvider from "./contexts/MsalContext";
import Login from "./pages/Login";
import { useUser } from "./contexts/UserContext";
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { currentUser, isLoading, isAdmin } = useUser();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // If admin access is required but user is not admin, redirect to dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Admin route component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedRoute requireAdmin>{children}</ProtectedRoute>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Index />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/employees/:id" element={<EmployeeDetail />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/my-trainings" element={<MyTrainings />} />
        <Route path="/my-qualifications" element={<MyQualifications />} />
        <Route path="/required-trainings" element={<RequiredTrainings />} />
        <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
        <Route path="/admin/positions" element={<AdminRoute><PositionManagement /></AdminRoute>} />
        <Route path="/admin/training-impact" element={<AdminRoute><TrainingImpact /></AdminRoute>} />
        <Route path="/admin/requirements" element={<AdminRoute><TrainingRequirementManagement /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MsalContextProvider>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </UserProvider>
    </MsalContextProvider>
  </QueryClientProvider>
);

export default App;
