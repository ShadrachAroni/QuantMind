import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getQuantMindTemplate, sendEmail, getInstitutionalSender } from '../_shared/email.ts';


const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async (req: Request) => {
  try {
    // 1. Fetch campaigns that need to be sent
    const { data: campaigns, error: fetchError } = await supabase
      .from('email_campaigns')
      .select('*, email_templates(*)')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString());

    if (fetchError) throw fetchError;

    const results = [];

    for (const campaign of campaigns || []) {
      // Check for expiration
      if (campaign.expires_at && new Date(campaign.expires_at) < new Date()) {
        await supabase.from('email_campaigns').update({ status: 'archived' }).eq('id', campaign.id);
        continue;
      }

      // 2. Resolve Recipients based on segmentation
      const { tiers, last_active_days } = campaign.target_segmentation || {};
      let query = supabase.from('user_profiles').select('id, email');
      
      if (tiers && tiers.length > 0) {
        query = query.in('tier', tiers);
      }
      
      if (last_active_days) {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - last_active_days);
        query = query.gte('updated_at', dateLimit.toISOString());
      }

      const { data: recipients, error: recError } = await query;
      if (recError) throw recError;

      // 3. Update campaign status to 'sending'
      await supabase.from('email_campaigns').update({ status: 'sending' }).eq('id', campaign.id);

      let sentCount = 0;
      let failCount = 0;

      for (const recipient of recipients || []) {
        // A/B Variant Logic
        const variant = Math.random() < (campaign.ab_test_ratio || 0.5) ? 'A' : 'B';
        const subject = variant === 'B' && campaign.subject_b ? campaign.subject_b : campaign.subject_a;
        const htmlBody = variant === 'B' && campaign.content_b ? campaign.content_b : (campaign.content_a || (campaign.email_templates as any)?.html_content || '');

        if (!htmlBody) {
          console.warn(`[Campaign Executor]: Missing HTML body for variant ${variant} in campaign ${campaign.id}`);
          continue;
        }

        // Inject tracking pixel and link wrapping
        const trackingPixel = `<img src="${SUPABASE_URL}/functions/v1/email-tracker/open?c=${campaign.id}&u=${recipient.id}" width="1" height="1" style="display:none" />`;
        const wrapLinks = (html: string) => {
           // Basic regex to wrap hrefs with tracker
           return html.replace(/href="([^"]+)"/g, `href="${SUPABASE_URL}/functions/v1/email-tracker/click?c=${campaign.id}&u=${recipient.id}&url=$1"`);
        };

        const finalHtml = getQuantMindTemplate(wrapLinks(htmlBody) + trackingPixel, campaign.name || "Special Offer");


        try {
          await sendEmail({
            from: getInstitutionalSender('offers'),
            to: recipient.email,
            subject,
            html: finalHtml,
            userId: recipient.id
          }, supabase);

          await supabase.from('campaign_recipients').upsert({
            campaign_id: campaign.id,
            user_id: recipient.id,
            variant,
            status: 'delivered',
            sent_at: new Date().toISOString()
          });

          sentCount++;
        } catch (err) {
          console.error(`Failed to send to ${recipient.email}:`, err);
          await supabase.from('campaign_recipients').upsert({
              campaign_id: campaign.id,
              user_id: recipient.id,
              variant,
              status: 'failed',
              error_message: err instanceof Error ? err.message : String(err)
          });
          failCount++;
        }
      }

      // 4. Mark campaign as sent
      await supabase.from('email_campaigns').update({ status: 'sent' }).eq('id', campaign.id);
      results.push({ campaign: campaign.name, sent: sentCount, failed: failCount });
    }

    return new Response(JSON.stringify({ success: true, processed: results }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500 });
  }
});
