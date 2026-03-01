/**
 * DomusVita Immobilienverwaltung - Sentry Error Monitoring
 * Only active when VITE_SENTRY_DSN is set.
 */
import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || "development",
    release: import.meta.env.VITE_SENTRY_RELEASE || "unknown",
    tracesSampleRate: 0.2,
    ignoreErrors: [
      "ResizeObserver loop",
      "Non-Error promise rejection",
      /chrome-extension:\/\//,
      /moz-extension:\/\//,
      "The play() request was interrupted",
      "play() failed because the user",
    ],
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers["Authorization"];
          delete event.request.headers["Cookie"];
        }
      }
      return event;
    },
  });
}
