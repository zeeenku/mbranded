import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
 
export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.url(),
    AI_GROK_API_KEY: z.string().min(1),
  
    OPEN_AI_API_KEY: z.string().min(1),
  },
  experimental__runtimeEnv: process.env
});