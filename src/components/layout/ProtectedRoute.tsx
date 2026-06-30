import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type ProtectedRouteProps = {
  requireAdmin?: boolean;
  requireClient?: boolean;
};

export function ProtectedRoute({ requireAdmin, requireClient }: ProtectedRouteProps) {
  const { session, isAdmin, isClient, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Loading secure workspace...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (requireAdmin && !isAdmin) {
    if (isClient) return <Navigate to="/client" replace />;
    return <Navigate to="/login" replace />;
  }

  if (requireClient && !isClient) {
    if (isAdmin) return <Navigate to="/app" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
