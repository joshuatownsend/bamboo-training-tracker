
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { useMobile } from "@/hooks/useMobile";
import { useUser } from "@/contexts/user";
import { Skeleton } from "@/components/ui/skeleton";

export function Layout() {
  const { isMobile } = useMobile();
  const { isLoading: userLoading } = useUser();

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
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
