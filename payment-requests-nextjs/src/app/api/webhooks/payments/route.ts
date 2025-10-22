import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase-server';
import { initSentry, Sentry } from '../../../../lib/sentry';
import { getRequestId, logError, logInfo } from '../../../../lib/logger';
import { verifyN8NToken } from '../../../../lib/n8n-auth';

// Payment provider webhook stub
// Body: { provider: string, external_id?: string, pr_id?: number, amount?: number, paid_at?: string }
// One of pr_id or external_id (+ mapping) must be provided. For now, we accept pr_id.
// Marks payment_request.pr_status = 'paid' and writes audit.
export async function POST(req: NextRequest) {
  initSentry();
  const requestId = getRequestId({ headerId: req.headers.get('x-request-id') });
  const auth = verifyN8NToken(req);
  if (!auth.ok) return auth.res;

  try {
    const idemKey = req.headers.get('x-idempotency-key');
    const body = await req.json();
    const { pr_id, provider, external_id, amount, paid_at } = body || {};

    if (!pr_id) {
      return NextResponse.json({ ok: false, error: 'pr_id required', requestId }, { status: 400 });
    }

    if (idemKey) {
      const { error: idemErr } = await supabaseServer
        .from('webhook_events')
        .insert([{ source: 'payments:webhook', event_id: String(idemKey) }]);
      if (idemErr && /duplicate key/i.test(idemErr.message)) {
        logInfo('payments.duplicate_ignored', { requestId, idemKey });
        return NextResponse.json({ ok: true, duplicate: true, requestId });
      }
      if (idemErr) {
        logError('payments.idempotency_failed', { requestId, error: idemErr.message });
        return NextResponse.json({ ok: false, error: 'Idempotency failed: ' + idemErr.message, requestId }, { status: 500 });
      }
    }

    const { data: updated, error: updErr } = await supabaseServer
      .from('payment_request')
      .update({ pr_status: 'paid' })
      .eq('id', pr_id)
      .select('id, pr_status')
      .single();

    if (updErr) {
      logError('payments.update_failed', { requestId, error: updErr.message });
      return NextResponse.json({ ok: false, error: updErr.message, requestId }, { status: 500 });
    }

    await supabaseServer
      .from('audit_log')
      .insert([{
        actor_user_id: null,
        entity_type: 'payment_request',
        entity_id: String(pr_id),
        action: 'payment_marked_paid',
        details: { provider, external_id, amount, paid_at }
      }]);

    logInfo('payments.paid_ok', { requestId, prId: pr_id });
    return NextResponse.json({ ok: true, data: updated, requestId });
  } catch (err: any) {
    Sentry.captureException(err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
