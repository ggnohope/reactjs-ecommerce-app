import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export default function Protected({ children, seller = false }: { children: ReactNode; seller?: boolean }) {
  const { authenticated, isSeller, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="label-mono animate-pulse">Loading…</span>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (seller && !isSeller) {
    return <Navigate to="/account" replace />;
  }

  return <>{children}</>;
}
