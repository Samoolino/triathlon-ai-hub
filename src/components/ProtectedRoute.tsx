import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground font-mono text-xs">
        AUTHENTICATING…
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/command" replace />;
  return <>{children}</>;
}
