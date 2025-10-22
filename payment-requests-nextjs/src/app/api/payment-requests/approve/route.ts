import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase-server';
import { initSentry, Sentry } from '../../../../lib/sentry';
import { getRequestId, logError, logInfo } from '../../../../lib/logger';

// Approve (or transition) a Payment Request
// Body: { pr_id: number, to?: 'approved'|'pending'|'rejected'|'processing', note?: string }
// Optional header: x-idempotency-key
export async function POST(req: NextRequest) {
  try {
    initSentry();
    const requestId = getRequestId({ headerId: req.headers.get('x-request-id') });
    const idemKey = req.headers.get('x-idempotency-key');
    const body = await req.json();
    const pr_id = body?.pr_id as number | undefined;
    const to = (body?.to as string | undefined) ?? 'approved';
    const note = (body?.note as string | undefined) ?? '';

    if (!pr_id) {
      return NextResponse.json({ ok: false, error: 'pr_id required', requestId }, { status: 400 });
    }

    if (idemKey) {
      const { error: idemErr } = await supabaseServer
        .from('webhook_events')
        .insert([{ source: 'pr:approve', event_id: String(idemKey) }]);
      if (idemErr && /duplicate key/i.test(idemErr.message)) {
        logInfo('pr.approve.duplicate_ignored', { requestId, idemKey });
        return NextResponse.json({ ok: true, duplicate: true, requestId });
      }
      if (idemErr) {
        logError('pr.approve.idempotency_failed', { requestId, error: idemErr.message });
        return NextResponse.json({ ok: false, error: 'Idempotency failed: ' + idemErr.message, requestId }, { status: 500 });
      }
    }

    // Load existing approval history
    const { data: pr, error: getErr } = await supabaseServer
      .from('payment_request')
      .select('id, pr_status, approval_history')
      .eq('id', pr_id)
      .single();

    if (getErr || !pr) {
      return NextResponse.json({ ok: false, error: getErr?.message || 'Not found', requestId }, { status: 404 });
    }

    const now = new Date().toISOString();
    const history = Array.isArray(pr.approval_history) ? pr.approval_history : [];
    const entry = { at: now, from: pr.pr_status, to, note };
    const nextHistory = [...history, entry];

    const { data: updated, error: updErr } = await supabaseServer
      .from('payment_request')
      .update({ pr_status: to, approval_history: nextHistory })
      .eq('id', pr_id)
      .select('id, pr_status, approval_history')
      .single();

    if (updErr) {
      logError('pr.approve.update_failed', { requestId, error: updErr.message });
      return NextResponse.json({ ok: false, error: updErr.message, requestId }, { status: 500 });
    }

    await supabaseServer
      .from('audit_log')
      .insert([{
        actor_user_id: null,
        entity_type: 'payment_request',
        entity_id: String(pr_id),
        action: 'status_transition',
        details: { from: pr.pr_status, to, note }
      }]);

    logInfo('pr.approve.ok', { requestId, prId: pr_id, to });
    return NextResponse.json({ ok: true, data: updated, requestId });
  } catch (err: any) {
    Sentry.captureException(err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
