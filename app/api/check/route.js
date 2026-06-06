// app/api/check/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.pdq_hash || !body.pdq_dihedral_hashes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate hash format — backend expects exactly 8 hashes of 64 hex chars each
    const hexRe = /^[0-9a-fA-F]{64}$/;
    if (!hexRe.test(body.pdq_hash)) {
      return NextResponse.json({ error: 'pdq_hash must be 64 hex characters' }, { status: 400 });
    }
    if (!Array.isArray(body.pdq_dihedral_hashes) || body.pdq_dihedral_hashes.length !== 8) {
      return NextResponse.json({ error: 'pdq_dihedral_hashes must be an array of exactly 8 hashes' }, { status: 400 });
    }
    if (!body.pdq_dihedral_hashes.every(h => hexRe.test(h))) {
      return NextResponse.json({ error: 'All dihedral hashes must be 64 hex characters' }, { status: 400 });
    }

    const API_URL = process.env.CORVINTH_API_URL;
    const API_KEY = process.env.CORVINTH_API_KEY;

    if (!API_URL || !API_KEY) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const backendResponse = await fetch(`${API_URL}/hash/check`, {
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
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}