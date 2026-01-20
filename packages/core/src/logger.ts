import { config } from "@core/config";
import pino from "pino";

const LOG_CONFIG = {
  wsRoomManagerDebugger: config.isDevelopment,
  wsServerDebugger: config.isDevelopment,
  wsServer: true,
  migration: true,
  db: true,
};

export const rootLogger = pino({
  level: config.isDevelopment ? "debug" : "info",
  transport: config.isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname,category",
          messageFormat: "\x1b[36m[{category}]\x1b[0m \x1b[90m-\x1b[0m {msg}",
          customColors: "info:cyan,warn:yellow,error:red,debug:magenta",
        },
      }
    : undefined,
});

export const getLogger = (category: keyof typeof LOG_CONFIG) =>
  rootLogger.child(
    { category },
    { level: LOG_CONFIG[category] ? undefined : "silent" },
  );
