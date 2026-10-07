import 'server-only';
import { handleDemoOperation } from '../../../lib/demo-gateway.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request, context) {
  const { operation } = await context.params;
  return handleDemoOperation(request, operation, {
    enabled: process.env.CORVINTH_DEMO_ENABLED === 'true',
    secret: process.env.CORVINTH_DEMO_GATEWAY_SECRET,
    backendUrl: process.env.CORVINTH_DEMO_BACKEND_URL ?? process.env.CORVINTH_API_URL,
    origins: process.env.CORVINTH_DEMO_ALLOWED_ORIGINS?.split(',').map((value) => value.trim()),
    allowLocal: process.env.CORVINTH_DEMO_ALLOW_LOCAL === 'true' && process.env.NODE_ENV !== 'production',
  });
}
