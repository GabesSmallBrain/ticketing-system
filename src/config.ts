const environment = process.env.NODE_ENV ?? 'development';

export const config = {
  environment,
  isProduction: environment === 'production',
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET,
  appOrigin: process.env.APP_ORIGIN,
  paymentProvider: process.env.PAYMENT_PROVIDER ?? (environment === 'production' ? '' : 'demo'),
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
};

export function validateProductionConfig() {
  if (!config.isProduction) return;
  const required = [
    ['DATABASE_URL', config.databaseUrl],
    ['SESSION_SECRET', config.sessionSecret],
    ['APP_ORIGIN', config.appOrigin],
    ['PAYMENT_PROVIDER', config.paymentProvider],
    ['PAYMENT_WEBHOOK_SECRET', config.paymentWebhookSecret],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (required.length) throw new Error(`Production configuration is missing: ${required.join(', ')}`);
  if (config.paymentProvider === 'demo') throw new Error('Demo payments are prohibited in production.');
}
