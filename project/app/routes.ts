import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("selection", "routes/selection.tsx"),
  route("payment", "routes/payment.tsx"),
  route("dosing", "routes/dosing.tsx"),
  route("thank-you", "routes/thank-you.tsx"),
  route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;
