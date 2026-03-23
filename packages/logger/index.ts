import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  transport: {
    target: "pino-pretty",
    options: {
      colorize: isDev,
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname",
    },
  },
});

export function createLogger(name: string) {
  return logger.child({ name });
}

export { logger };
export default logger;
