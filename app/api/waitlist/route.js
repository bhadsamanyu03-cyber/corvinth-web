import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.contact_name || !body.work_email || !body.company_name || !body.platform_url || !body.platform_type || !body.monthly_upload_volume) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const API_URL = process.env.CORVINTH_API_URL;
    const API_KEY = process.env.CORVINTH_API_KEY;

    if (!API_URL || !API_KEY) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const backendResponse = await fetch(`${API_URL}/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });

  } catch (error) {
    console.error("Waitlist Proxy Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}