
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { useMobile } from "@/hooks/useMobile";

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isMobile } = useMobile();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className={`flex flex-1 flex-col ${isMobile ? 'w-full' : 'ml-64'}`}>
        <Header />
        <main className="flex-1 p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default Layout;
