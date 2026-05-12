import { logger } from "../lib/logger";

export const startKeepAlive = (url: string) => {
  // Pings every 14 minutes (840000 ms) to prevent Render free tier from sleeping (sleeps after 15 mins)
  const INTERVAL = 14 * 60 * 1000;

  logger.info(`Starting keep-alive for ${url} every 14 minutes`);

  setInterval(() => {
    logger.info(`Pinging ${url}/api/health to keep service awake...`);

    fetch(`${url}/api/health`)
      .then((res) => {
        if (res.ok) {
          logger.info("Keep-alive ping successful");
        } else {
          logger.warn(`Keep-alive ping failed with status code: ${res.status}`);
        }
      })
      .catch((err) => {
        logger.error(`Keep-alive ping error: ${err.message}`);
      });
  }, INTERVAL);
};
