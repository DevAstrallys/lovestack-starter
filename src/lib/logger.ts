/**
 * Centralized structured logger.
 * Outputs JSON lines — ready for Docker / K8s log collectors (Fluentd, Loki…).
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  service: string;
  timestamp: string;
  data?: unknown;
}

const IS_DEV = import.meta.env.DEV;

function emit(entry: LogEntry) {
  const payload = JSON.stringify(entry);
  switch (entry.level) {
    case 'error':
      console.error(payload);
      break;
    case 'warn':
      console.warn(payload);
      break;
    case 'debug':
      if (IS_DEV) console.debug(payload);
      break;
    default:
      console.log(payload);
  }
}

export function createLogger(service: string) {
  const log = (level: LogLevel, message: string, data?: unknown) => {
    emit({ level, message, service, timestamp: new Date().toISOString(), data });
  };

  return {
    debug: (msg: string, data?: unknown) => log('debug', msg, data),
    info: (msg: string, data?: unknown) => log('info', msg, data),
    warn: (msg: string, data?: unknown) => log('warn', msg, data),
    error: (msg: string, data?: unknown) => log('error', msg, data),
  };
}

/** Default app-wide logger */
export const logger = createLogger('app');
