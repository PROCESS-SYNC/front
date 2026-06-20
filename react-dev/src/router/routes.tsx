import type { RouteConfig } from "@/common/router/types";
import { authRoutes } from "./auth";

export const routes: RouteConfig[] = [...authRoutes];
