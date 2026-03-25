import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { encrypt, decrypt } from '@/lib/encryption';

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_ai_configs')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // We return the configs but mask the encrypted keys
  const sanitized = data.map((cfg: any) => ({
    id: cfg.id,
    provider: cfg.provider,
    model_id: cfg.model_id,
    is_active: cfg.is_active,
    has_key: !!cfg.encrypted_api_key
  }));

  return NextResponse.json({ configs: sanitized });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!ENCRYPTION_SECRET || ENCRYPTION_SECRET.length < 32) {
    console.error('SERVER_ERROR::MISSING_ENCRYPTION_SECRET');
    return NextResponse.json({ error: 'System architecture not ready for secure storage' }, { status: 500 });
  }

  const body = await req.json();
  const { provider, model_id, api_key, is_active } = body;

  if (!provider || !model_id) {
    return NextResponse.json({ error: 'Missing required configuration fields' }, { status: 400 });
  }

  // Encrypt key if provided
  let encrypted_api_key = null;
  if (api_key) {
    try {
      encrypted_api_key = encrypt(api_key, ENCRYPTION_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Encryption protocol failure' }, { status: 500 });
    }
  }

  // Upsert config
  const { data, error } = await supabase
    .from('user_ai_configs')
    .upsert({
      user_id: user.id,
      provider,
      model_id,
      encrypted_api_key: encrypted_api_key || undefined, // don't overwrite if not provided
      is_active: is_active ?? true,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id, provider'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, config: { id: data.id, provider: data.provider } });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing configuration ID' }, { status: 400 });
  }

  const { error } = await supabase
    .from('user_ai_configs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
