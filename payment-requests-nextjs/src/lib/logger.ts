import { randomUUID } from 'crypto';

export type LogLevel = 'info' | 'warn' | 'error';

export function getRequestId(init?: { headerId?: string | null }) {
  return init?.headerId || randomUUID();
}

function baseLog(level: LogLevel, message: string, fields: Record<string, any> = {}) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...fields,
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

export const logInfo = (message: string, fields?: Record<string, any>) => baseLog('info', message, fields);
export const logWarn = (message: string, fields?: Record<string, any>) => baseLog('warn', message, fields);
export const logError = (message: string, fields?: Record<string, any>) => baseLog('error', message, fields);
