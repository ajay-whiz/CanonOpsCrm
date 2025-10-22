import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { supabaseServer } from '../../../../lib/supabase-server';

const ASANA_SECRET = process.env.ASANA_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    if (!ASANA_SECRET) {
      return NextResponse.json({ message: 'Missing ASANA_SECRET' }, { status: 500 });
    }

    const signature = req.headers.get('x-asana-signature');
    const bodyText = await req.text();
    const hmac = createHmac('sha256', ASANA_SECRET).update(bodyText).digest('hex');
    if (signature !== hmac) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    const payload = JSON.parse(bodyText || '{}');
    const events: any[] = Array.isArray(payload?.events) ? payload.events : [];

    for (const event of events) {
      if (event.action === 'create' && event.resource?.type === 'task') {
        const { id, gid, name, due_on } = event.resource || {};
        const eventId = `${gid || id || 'unknown'}:${event.action}`;

        const { error: idemErr } = await supabaseServer
          .from('webhook_events')
          .insert([{ source: 'asana', event_id: eventId }]);

        if (idemErr && !/duplicate key/i.test(idemErr.message)) {
          return NextResponse.json({ message: 'Idempotency check failed', error: idemErr.message }, { status: 500 });
        }
        if (idemErr && /duplicate key/i.test(idemErr.message)) {
          continue; // already processed
        }

        const { data: prData, error: prErr } = await supabaseServer
          .from('payment_request')
          .insert([{ asana_id: gid || id, title: name, due_date: due_on, pr_status: 'staging' }])
          .select('id')
          .single();

        if (prErr) {
          return NextResponse.json({ message: 'Error creating payment request', error: prErr.message }, { status: 500 });
        }

        await supabaseServer
          .from('audit_log')
          .insert([{ actor_user_id: null, entity_type: 'payment_request', entity_id: String(prData.id), action: 'created_from_asana', details: { event } }]);
      }
    }

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (err: any) {
    return NextResponse.json({ message: 'Unhandled error', error: err?.message ?? String(err) }, { status: 500 });
  }
}
