export interface AppConfig {
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  port: number;
  webOrigin: string;
  cookieSecure: boolean;
}

export const SESSION_COOKIE = 'perio_session';

/** Reads and validates environment variables once at startup. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  const jwtSecret = env.JWT_SECRET as string;
  if (env.NODE_ENV === 'production' && (jwtSecret === 'change-me' || jwtSecret.length < 32)) {
    throw new Error('JWT_SECRET must be a random string of at least 32 characters in production');
  }
  return {
    databaseUrl: env.DATABASE_URL as string,
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
    port: Number(env.PORT || 4000),
    webOrigin: env.WEB_ORIGIN || 'http://localhost:3000',
    cookieSecure: env.COOKIE_SECURE === 'true',
  };
}
