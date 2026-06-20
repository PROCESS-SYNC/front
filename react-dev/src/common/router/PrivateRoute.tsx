import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/common/store/authStore";

interface PrivateRouteProps {
  element: React.ReactNode;
}

const PrivateRoute = ({ element }: PrivateRouteProps) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{element}</> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
