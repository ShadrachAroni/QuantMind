import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { 
  sendEmail, 
  getInstitutionalSender, 
  getSupportReplyTemplate 
} from "../_shared/email.ts"

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!)
  
  try {
    // 1. Verify Admin Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 401, headers: corsHeaders })
    
    // We use the service role client to check the profile of the user authenticated by the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized credentials' }), { status: 401, headers: corsHeaders })
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Institutional admin privileges required' }), { status: 403, headers: corsHeaders })
    }

    // 2. Parse Payload
    const { ticket_id, content, status = 'pending' } = await req.json()
    if (!ticket_id || !content) {
      return new Response(JSON.stringify({ error: 'Ticket ID and content are required' }), { status: 400, headers: corsHeaders })
    }

    // 3. Fetch Ticket & Recipient Details
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*, user_profiles(email)')
      .eq('id', ticket_id)
      .single()

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({ error: 'Support session not found' }), { status: 404, headers: corsHeaders })
    }

    const recipientEmail = ticket.user_profiles?.email || ticket.metadata?.original_from
    if (!recipientEmail) {
      throw new Error('Could not identify institutional recipient for this relay.')
    }

    // 4. Dispatch Email via Resend Relay
    const ticketTag = ticket_id.split('-')[0].toUpperCase()
    await sendEmail({
      from: getInstitutionalSender('support'),
      to: recipientEmail,
      subject: `Re: ${ticket.subject} [Ticket ID: QS-${ticketTag}]`,
      html: getSupportReplyTemplate(ticketTag, content)
    })

    // 5. Log Transmission & Update State
    const { error: msgError } = await supabase.from('support_messages').insert({
      ticket_id,
      user_id: user.id, // Logged as admin response
      content: content,
      is_staff: true,
      sender_type: 'human'
    })

    if (msgError) throw msgError

    const { error: updateError } = await supabase.from('support_tickets').update({
      status,
      updated_at: new Date().toISOString()
    }).eq('id', ticket_id)

    if (updateError) throw updateError

    console.log(`[Support Outbound] Successfully dispatched reply for ticket ${ticketTag} to ${recipientEmail}`)

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Transmission dispatched via Resend relay.',
      relay_id: ticketTag 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[Support Outbound Error]:', error.message)
    return new Response(JSON.stringify({ 
      error: error.message,
      code: 'RELAY_FAILURE'
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})
