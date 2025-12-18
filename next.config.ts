import type { NextConfig } from "next"
import "@/config/env";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"],
}
 
export default nextConfig