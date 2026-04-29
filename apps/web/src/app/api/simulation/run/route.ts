import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SIMULATION_URL = process.env.SIMULATION_SERVICE_URL || 'https://kingaroni-docker.hf.space';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const HMAC_SECRET_KEY = process.env.HMAC_SECRET_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seed } = body;

    if (!seed) {
      return NextResponse.json({ error: 'Seed context is required' }, { status: 400 });
    }

    // Prepare the payload
    const payload = {
      simulation_id: `miro_${Date.now()}`,
      user_id: 'web_user',
      seed_context: seed,
      steps: 24
    };
    
    const bodyString = JSON.stringify(payload);
    
    // Generate HMAC signature for integrity check
    const hmacSignature = crypto
      .createHmac('sha256', HMAC_SECRET_KEY)
      .update(bodyString)
      .digest('hex');

    // Proxy the request to the FastAPI backend with security headers
    const response = await fetch(`${SIMULATION_URL}/simulate/mirofish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'X-HMAC-Signature': hmacSignature,
      },
      body: bodyString,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MiroFish Backend Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Simulation Bridge Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect to simulation engine' },
      { status: 500 }
    );
  }
}
