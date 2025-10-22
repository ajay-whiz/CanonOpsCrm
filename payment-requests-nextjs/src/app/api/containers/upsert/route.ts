import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase-server';
import { initSentry, Sentry } from '../../../../lib/sentry';
import { getRequestId, logError, logInfo } from '../../../../lib/logger';

export async function POST(req: NextRequest) {
  try {
    initSentry();
    const requestId = getRequestId({ headerId: req.headers.get('x-request-id') });
    const trace = req.headers.get('traceparent');
    const idemKey = req.headers.get('x-idempotency-key');
    const body = await req.json();
    const { name, external_id, meta } = body || {};
    if (!name && !external_id) {
      return NextResponse.json({ ok: false, error: 'name or external_id required', requestId }, { status: 400 });
    }

    if (idemKey) {
      const { error: idemErr } = await supabaseServer
        .from('webhook_events')
        .insert([{ source: 'n8n:containers', event_id: String(idemKey) }]);
      if (idemErr && /duplicate key/i.test(idemErr.message)) {
        logInfo('containers.duplicate_ignored', { requestId, idemKey, trace });
        return NextResponse.json({ ok: true, duplicate: true, requestId });
      }
      if (idemErr) {
        logError('containers.idempotency_failed', { requestId, error: idemErr.message, trace });
        return NextResponse.json({ ok: false, error: 'Idempotency failed: ' + idemErr.message, requestId }, { status: 500 });
      }
    }

    const payload: any = { name: name ?? null, external_id: external_id ?? null, meta: meta ?? {} };
    let upsertOptions: any = undefined;
    if (external_id) upsertOptions = { onConflict: 'external_id' };
    else if (name) upsertOptions = { onConflict: 'name' };

    const { data, error } = await supabaseServer
      .from('container')
      .upsert([payload], upsertOptions)
      .select('id, name, external_id, meta')
      .limit(1);

    if (error) {
      logError('containers.upsert_failed', { requestId, error: error.message, trace });
      return NextResponse.json({ ok: false, error: error.message, requestId }, { status: 500 });
    }

    logInfo('containers.upsert_ok', { requestId, id: data?.[0]?.id, trace });
    return NextResponse.json({ ok: true, data: data?.[0] ?? null, requestId });
  } catch (err: any) {
    Sentry.captureException(err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
