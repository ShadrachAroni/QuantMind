import { NextRequest, NextResponse } from 'next/server';

const SIMULATION_URL = process.env.SIMULATION_SERVICE_URL || 'https://kingaroni-docker.hf.space';
const SIMULATION_SECRET = process.env.SIMULATION_SECRET_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seed } = body;

    if (!seed) {
      return NextResponse.json({ error: 'Seed context is required' }, { status: 400 });
    }

    // Proxy the request to the Hugging Face FastAPI backend (MiroFish Endpoint)
    const response = await fetch(`${SIMULATION_URL}/simulate/mirofish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Simulation-Secret': SIMULATION_SECRET,
      },
      body: JSON.stringify({
        simulation_id: `miro_${Date.now()}`,
        user_id: 'web_user',
        seed_context: seed,
        steps: 24
      }),
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
