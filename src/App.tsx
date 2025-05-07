
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import UserProvider from "./contexts/UserContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/:id" element={<EmployeeDetail />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/my-trainings" element={<MyTrainings />} />
              <Route path="/my-qualifications" element={<MyQualifications />} />
              <Route path="/required-trainings" element={<RequiredTrainings />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/positions" element={<PositionManagement />} />
              <Route path="/admin/training-impact" element={<TrainingImpact />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
