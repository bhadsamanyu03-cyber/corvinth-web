import 'server-only';
import { handleDemoSession } from '../../../lib/demo-gateway.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function handle(request) {
  return handleDemoSession(request, {
    enabled: process.env.CORVINTH_DEMO_ENABLED === 'true',
    secret: process.env.CORVINTH_DEMO_GATEWAY_SECRET,
    backendUrl: process.env.CORVINTH_API_URL,
    origins: process.env.CORVINTH_DEMO_ALLOWED_ORIGINS?.split(',').map((value) => value.trim()),
    allowLocal: process.env.CORVINTH_DEMO_ALLOW_LOCAL === 'true' && process.env.NODE_ENV !== 'production',
  });
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
