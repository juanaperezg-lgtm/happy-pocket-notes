import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { startKeepAlive } from "./utils/keep-alive";

const start = async () => {
  await prisma.$connect();

  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
    
    if (env.RENDER_EXTERNAL_URL) {
      startKeepAlive(env.RENDER_EXTERNAL_URL);
    }
  });
};

void start();
