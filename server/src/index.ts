import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const start = async () => {
  await prisma.$connect();

  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
};

void start();
