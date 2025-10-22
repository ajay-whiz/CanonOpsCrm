import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase-server';
import { initSentry, Sentry } from '../../../../lib/sentry';
import { getRequestId, logError, logInfo } from '../../../../lib/logger';
import { verifyN8NToken } from '../../../../lib/n8n-auth';

export async function POST(req: NextRequest) {
  try {
    initSentry();
    const requestId = getRequestId({ headerId: req.headers.get('x-request-id') });
    const auth = verifyN8NToken(req);
    if (!auth.ok) return auth.res;
    const body = await req.json();
    const idemKey = req.headers.get('x-idempotency-key');
    if (idemKey) {
      const { error: idemErr } = await supabaseServer
        .from('webhook_events')
        .insert([{ source: 'n8n:contacts', event_id: idemKey }]);
      if (idemErr && /duplicate key/i.test(idemErr.message)) {
        logInfo('contacts.duplicate_ignored', { requestId, idemKey });
        return NextResponse.json({ ok: true, duplicate: true, requestId });
      }
      if (idemErr) {
        logError('contacts.idempotency_failed', { requestId, error: idemErr.message });
        return NextResponse.json({ ok: false, error: 'Idempotency failed: ' + idemErr.message, requestId }, { status: 500 });
      }
    }
    const { email, name, meta } = body || {};
    if (!email && !name) {
      return NextResponse.json({ ok: false, error: 'email or name required', requestId }, { status: 400 });
    }

    const payload: any = { email: email ?? null, name: name ?? null, meta: meta ?? {} };
    // Use upsert keyed on email when available; otherwise, upsert by combination (email OR name)
    let upsertOptions: any = undefined;
    if (email) {
      upsertOptions = { onConflict: 'email' };
    }

    const { data, error } = await supabaseServer
      .from('contact')
      .upsert([payload], upsertOptions)
      .select('id, email, name, meta')
      .limit(1);

    if (error) {
      logError('contacts.upsert_failed', { requestId, error: error.message });
      return NextResponse.json({ ok: false, error: error.message, requestId }, { status: 500 });
    }

    logInfo('contacts.upsert_ok', { requestId, id: data?.[0]?.id });
    return NextResponse.json({ ok: true, data: data?.[0] ?? null, requestId });
  } catch (err: any) {
    Sentry.captureException(err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
