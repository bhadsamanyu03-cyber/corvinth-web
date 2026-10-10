import { handleConsole, consoleCredentials } from '../../../lib/console-gateway.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request, context) {
  const { operation } = await context.params;
  const credentials = consoleCredentials(process.env);
  return handleConsole(request, operation, {
    runtimeReadiness: process.env.CORVINTH_RUNTIME_READINESS_ENABLED === 'true',
    enabled: process.env.CORVINTH_CONSOLE_ENABLED === 'true',
    backendUrl: process.env.CORVINTH_CONSOLE_BACKEND_URL,
    secret: process.env.CORVINTH_CONSOLE_GATEWAY_SECRET,
    origins: (process.env.CORVINTH_CONSOLE_ORIGINS || 'https://corvinth.com,https://www.corvinth.com').split(',').map(value => value.trim()),
    allowLocal: process.env.NODE_ENV !== 'production' && process.env.CORVINTH_CONSOLE_ALLOW_LOCAL_BACKEND === 'true',
    credentials,
  });
}
export { handle as GET, handle as POST, handle as DELETE };
