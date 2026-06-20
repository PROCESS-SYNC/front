import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { RouteConfig } from "@/common/router/types";
import PrivateRoute from "@/common/router/PrivateRoute";

interface AppRouterProps {
  routes: RouteConfig[];
  defaultPath: string;
}

const AppRouter = ({ routes, defaultPath }: AppRouterProps) => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 기본 경로 리다이렉트 */}
        <Route path="/" element={<Navigate to={defaultPath} replace />} />

        {routes.map(({ path, element, isPrivate }) => (
          <Route
            key={path}
            path={path}
            element={
              isPrivate ? (
                <PrivateRoute element={element} />
              ) : (
                (element as React.ReactElement)
              )
            }
          />
        ))}

        {/* 404 */}
        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
