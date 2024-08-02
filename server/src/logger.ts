import * as log from "@std/log";

const logLevel = <log.LevelName> Deno.env.get("LOG_LEVEL") ?? "INFO";
const testLogLevel = <log.LevelName> Deno.env.get("TEST_LOG_LEVEL") ?? "INFO";

log.setup({
  handlers: {
    default: new log.ConsoleHandler(logLevel),
    test: new log.ConsoleHandler(testLogLevel),
  },
  loggers: {
    default: {
      handlers: ["default"],
    },
    test: {
      handlers: ["test"],
    },
  },
});

export default log.getLogger();
export const testLogger = log.getLogger("test");
