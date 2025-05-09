
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import { useMobile } from "@/hooks/useMobile";
import { useUser } from "@/contexts/UserContext";
import { Skeleton } from "@/components/ui/skeleton";

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isMobile } = useMobile();
  const { isLoading: userLoading } = useUser();
  const location = useLocation();

  // If user is loading, show a loading skeleton
  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex flex-1">
          <div className="w-64 bg-black">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="flex-1 p-6">
            <Skeleton className="w-full h-12 mb-8" />
            <Skeleton className="w-full h-[400px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className={`flex flex-1 flex-col ${isMobile ? 'w-full' : 'ml-4'}`}>
        <Header />
        <main className="flex-1 p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default Layout;
