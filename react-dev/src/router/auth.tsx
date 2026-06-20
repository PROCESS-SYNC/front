import type { RouteConfig } from "@/common/router/types";
import LOGIN from "@/pages/auth/LOGIN";

export const authRoutes: RouteConfig[] = [
  {
    path: "/login",
    element: <LOGIN />,
    isPrivate: false,
    layout: "auth",
  },
];
