import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// 1x1 Transparent GIF
const PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 
  0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 
  0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 
  0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
]);

serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const campaignId = url.searchParams.get('c');
  const userId = url.searchParams.get('u');

  if (!campaignId || !userId) {
    return new Response('MISSING_PARAMETERS', { status: 400 });
  }

  try {
    if (path.includes('/open')) {
      // 1. Log Open Event
      await supabase
        .from('campaign_recipients')
        .update({ status: 'opened', opened_at: new Date().toISOString() })
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .is('opened_at', null); // Only log the first open

      return new Response(PIXEL, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    if (path.includes('/click')) {
      const redirectUrl = url.searchParams.get('url');
      if (!redirectUrl) return new Response('MISSING_REDIRECT_URL', { status: 400 });

      // 2. Log Click Event
      await supabase
        .from('campaign_recipients')
        .update({ status: 'clicked', clicked_at: new Date().toISOString() })
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .is('clicked_at', null);

      return Response.redirect(redirectUrl, 302);
    }

    return new Response('NOT_FOUND', { status: 404 });

  } catch (err) {
    console.error('Tracking Error:', err);
    return new Response('INTERNAL_ERROR', { status: 500 });
  }
});
