import { NextRequest, NextResponse } from 'next/server';

const SIMULATION_URL = process.env.SIMULATION_SERVICE_URL || 'https://kingaroni-docker.hf.space';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${SIMULATION_URL}/health`, {
      method: 'GET',
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      return NextResponse.json({ status: 'offline', error: response.statusText }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json({ status: 'online', ...data });
  } catch (error: any) {
    return NextResponse.json({ status: 'offline', error: error.message }, { status: 200 });
  }
}
