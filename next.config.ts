import type { NextConfig } from "next"
import "@/config/env";
import { withRouteGeneration } from './next-plugin-route-gen';

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"],
  // Enable typed routes for better type safety (moved from experimental in Next.js 16)
  typedRoutes: true,
}

// Automatically generate routes during dev and build
// Configuration is read from route-gen.config.ts
export default withRouteGeneration(nextConfig);