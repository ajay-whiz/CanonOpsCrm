import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { supabaseServer } from '../../../../lib/supabase-server';
import { initSentry, Sentry } from '../../../../lib/sentry';
import { getRequestId, logError, logInfo, logWarn } from '../../../../lib/logger';

const ASANA_SECRET = process.env.ASANA_SECRET || '';

export async function POST(req: NextRequest) {
  initSentry();
  const requestId = getRequestId({ headerId: req.headers.get('x-request-id') });
  try {
    if (!ASANA_SECRET) {
      return NextResponse.json({ message: 'Missing ASANA_SECRET', requestId }, { status: 500 });
    }

    const signature = req.headers.get('x-asana-signature');
    const bodyText = await req.text();
    const hmac = createHmac('sha256', ASANA_SECRET).update(bodyText).digest('hex');
    if (signature !== hmac) {
      logWarn('asana.invalid_signature', { requestId });
      return NextResponse.json({ message: 'Invalid signature', requestId }, { status: 403 });
    }

    const payload = JSON.parse(bodyText || '{}');
    const events: any[] = Array.isArray(payload?.events) ? payload.events : [];

    logInfo('asana.webhook.received', { requestId, eventsCount: events.length });
    for (const event of events) {
      if (event.action === 'create' && event.resource?.type === 'task') {
        const { id, gid, name, due_on } = event.resource || {};
        const eventId = `${gid || id || 'unknown'}:${event.action}`;

        const { error: idemErr } = await supabaseServer
          .from('webhook_events')
          .insert([{ source: 'asana', event_id: eventId }]);

        if (idemErr && !/duplicate key/i.test(idemErr.message)) {
          logError('asana.idempotency_failed', { requestId, error: idemErr.message });
          return NextResponse.json({ message: 'Idempotency check failed', error: idemErr.message, requestId }, { status: 500 });
        }
        if (idemErr && /duplicate key/i.test(idemErr.message)) {
          logInfo('asana.duplicate_ignored', { requestId, eventId });
          continue; // already processed
        }

        const { data: prData, error: prErr } = await supabaseServer
          .from('payment_request')
          .insert([{ asana_id: gid || id, title: name, due_date: due_on, pr_status: 'staging' }])
          .select('id')
          .single();

        if (prErr) {
          logError('asana.pr_create_failed', { requestId, error: prErr.message });
          return NextResponse.json({ message: 'Error creating payment request', error: prErr.message, requestId }, { status: 500 });
        }

        await supabaseServer
          .from('audit_log')
          .insert([{ actor_user_id: null, entity_type: 'payment_request', entity_id: String(prData.id), action: 'created_from_asana', details: { event } }]);
        logInfo('asana.pr_created', { requestId, prId: prData.id, eventId });
      }
    }

    return NextResponse.json({ message: 'Webhook processed successfully', requestId });
  } catch (err: any) {
    Sentry.captureException(err);
    logError('asana.unhandled_error', { requestId, error: err?.message ?? String(err) });
    return NextResponse.json({ message: 'Unhandled error', error: err?.message ?? String(err), requestId }, { status: 500 });
  }
}
