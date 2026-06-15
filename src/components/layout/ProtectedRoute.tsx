import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { RoleName } from "@/types/database";

export function ProtectedRoute({ roles }: { roles?: RoleName[] }) {
  const { session, role, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading secure workspace...</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (roles?.length && (!role || !roles.includes(role))) return <Navigate to="/app" replace />;
  return <Outlet />;
}
