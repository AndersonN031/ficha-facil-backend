import * as dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn:
    process.env.NODE_ENV === 'production' ? process.env.SENTRY_DSN : undefined,
  environment: process.env.NODE_ENV,
});
