import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Webhook } from "https://esm.sh/svix@1.15.0"
import { 
  sendEmail, 
  getInstitutionalSender, 
  getSupportTicketReceivedTemplate 
} from "../_shared/email.ts"

const resendWebhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!)

serve(async (req: Request) => {
  // 1. Verify Webhook Signature
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers.entries())

  if (resendWebhookSecret) {
    try {
      const wh = new Webhook(resendWebhookSecret)
      wh.verify(payload, headers)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[Webhook Verification Failed]:', error.message)
      return new Response('Invalid Signature', { status: 401 })
    }
  } else {
    console.warn('[Security Warning]: RESEND_WEBHOOK_SECRET is not set. Skipping signature verification.')
  }

  const { type, data } = JSON.parse(payload)

  // 2. Handle 'email.received' event
  if (type === 'email.received') {
    const toAddress = data.to[0].toLowerCase()
    const fromAddress = data.from.toLowerCase()
    const subject = data.subject || "(No Subject)"
    const content = data.text || data.html || "(No Content)"

    // Only process support@quantmind.co.ke
    if (!toAddress.includes('support@quantmind.co.ke')) {
      console.log(`[Support] Ignoring email to ${toAddress}`)
      return new Response('OK - Not support address', { status: 200 })
    }

    try {
      // 3. Resolve User ID from Profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', fromAddress)
        .maybeSingle()

      const userId = profile?.id // Might be null if it's an external client

      // 4. Create/Find Support Ticket
      // For simplicity, we search for an 'open' ticket with same subject or create new
      let ticketId: string

      const { data: existingTicket } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingTicket) {
        ticketId = existingTicket.id
      } else {
        const { data: newTicket, error: ticketError } = await supabase
          .from('support_tickets')
          .insert({
            user_id: userId, // Can be null
            subject: subject,
            status: 'open',
            priority: 'normal',
            metadata: { 
              source: 'inbound_email',
              original_from: fromAddress,
              original_to: toAddress
            }
          })
          .select()
          .single()

        if (ticketError) throw ticketError
        ticketId = newTicket.id
      }

      // 5. Insert Support Message
      const { error: msgError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          is_staff: false,
          content: content,
          sender_type: 'human'
        })

      if (msgError) throw msgError

      // 6. Send Auto-Reply Confirmation
      await sendEmail({
        from: getInstitutionalSender('support'),
        to: fromAddress,
        subject: `[Re: ${subject}] Support Session Initialized - QuantMind`,
        html: getSupportTicketReceivedTemplate(ticketId.split('-')[0].toUpperCase(), subject)
      })

      console.log(`[Support] Handled inbound email from ${fromAddress}. Ticket: ${ticketId}`)
      return new Response(JSON.stringify({ success: true, ticket_id: ticketId }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      })

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[Support Error]:', error.message)
      return new Response('Internal Server Error', { status: 500 })
    }
  }

  return new Response('OK - Unhandled Event', { status: 200 })
})
