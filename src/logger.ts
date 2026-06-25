export type LogLevel = "debug" | "info" | "warn" | "error";
const ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export interface Logger {
  debug(msg: string, meta?: object): void;
  info(msg: string, meta?: object): void;
  warn(msg: string, meta?: object): void;
  error(msg: string, meta?: object): void;
}

export function createLogger(level: LogLevel): Logger {
  const min = ORDER[level];
  const write = (lvl: LogLevel, msg: string, meta?: object) => {
    if (ORDER[lvl] < min) return;
    const line = JSON.stringify({ lvl, msg, ...(meta ?? {}) }) + "\n";
    process.stderr.write(line);
  };
  return {
    debug: (m, meta) => write("debug", m, meta),
    info: (m, meta) => write("info", m, meta),
    warn: (m, meta) => write("warn", m, meta),
    error: (m, meta) => write("error", m, meta),
  };
}
