import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
    route("/integrations", "routes/integrations.tsx"),
    route("/login", "routes/login.tsx"),
    route("/register", "routes/register.tsx"),
] satisfies RouteConfig;
