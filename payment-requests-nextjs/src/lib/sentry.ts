import * as Sentry from '@sentry/nextjs';

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || '';

let initialized = false;
export function initSentry() {
  if (initialized || !DSN) return;
  Sentry.init({
    dsn: DSN,
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.0,
    environment: process.env.NODE_ENV || 'development',
  });
  initialized = true;
}

export { Sentry };
