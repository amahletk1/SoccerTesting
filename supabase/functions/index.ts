import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get pending emails
  const { data: emails, error } = await supabase
    .from('email_notifications')
    .select('*')
    .eq('status', 'pending')
    .limit(10);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;
  for (const email of emails || []) {
    // Here you would call your email service (Resend, SendGrid, etc.)
    console.log(`Would send email to: ${email.recipient_email}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`Message: ${email.message}`);
    
    // Mark as sent
    await supabase
      .from('email_notifications')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', email.id);
    
    sent++;
  }

  return new Response(JSON.stringify({ sent, total: emails?.length || 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});