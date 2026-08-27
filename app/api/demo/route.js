import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const hash = typeof body.pdq_hash === 'string' ? body.pdq_hash.trim() : '';

    if (!/^[0-9a-fA-F]{64}$/.test(hash)) {
      return NextResponse.json(
        { error: 'pdq_hash must be exactly 64 hexadecimal characters' },
        { status: 422 },
      );
    }

    const apiUrl = process.env.CORVINTH_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: 'Public sandbox is not configured' }, { status: 503 });
    }

    const backendResponse = await fetch(`${apiUrl.replace(/\/$/, '')}/demo/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdq_hash: hash.toLowerCase(),
        source: typeof body.source === 'string' && body.source ? body.source : 'homepage_demo',
      }),
      cache: 'no-store',
    });

    const data = await backendResponse.json().catch(() => ({ error: backendResponse.statusText }));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Demo Proxy Error:', error);
    return NextResponse.json({ error: 'Public sandbox request failed' }, { status: 500 });
  }
}
