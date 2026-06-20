export interface RouteConfig {
  path: string;
  element: React.ReactElement;
  isPrivate?: boolean;
  layout?: "default" | "auth" | "none";
}
