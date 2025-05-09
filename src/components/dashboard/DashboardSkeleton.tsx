
import { Skeleton } from "@/components/ui/skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-9 w-28" />
      </div>
      
      {/* Stats cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(null).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow h-[360px] border border-gray-100 p-6">
            <Skeleton className="h-6 w-48 mb-6" />
            <Skeleton className="h-[280px] w-full" />
          </div>
        </div>
        <div>
          <div className="bg-white rounded-lg shadow h-[360px] border border-gray-100 p-6">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="space-y-4">
              {Array(5).fill(null).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
