import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface PushPayload {
  userId: string;
  title?: string;
  body?: string;
  data?: any;
}

serve(async (req: Request) => {
  try {
    const payload: PushPayload = await req.json();
    const { userId, title, body, data } = payload;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400 });
    }

    // 1. Get tokens for this user
    const { data: tokenData, error: tokenError } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokenError) throw tokenError;

    if (!tokenData || tokenData.length === 0) {
      return new Response(JSON.stringify({ status: 'no_tokens_found' }), { status: 200 });
    }

    const tokens = tokenData.map((t: { token: string }) => t.token);

    // 2. Prepare Expo Push Message
    const messages = tokens.map((token: string) => ({
      to: token,
      sound: 'default',
      title: title || 'QuantMind Notification',
      body: body || 'New analytical shift detected.',
      data: data || {},
    }));

    // 3. Batch send to Expo
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const resData = await response.json();

    return new Response(JSON.stringify(resData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
