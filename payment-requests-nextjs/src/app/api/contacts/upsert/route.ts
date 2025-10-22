import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idemKey = req.headers.get('x-idempotency-key');
    if (idemKey) {
      const { error: idemErr } = await supabaseServer
        .from('webhook_events')
        .insert([{ source: 'n8n:contacts', event_id: idemKey }]);
      if (idemErr && /duplicate key/i.test(idemErr.message)) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      if (idemErr) {
        return NextResponse.json({ ok: false, error: 'Idempotency failed: ' + idemErr.message }, { status: 500 });
      }
    }
    const { email, name, meta } = body || {};
    if (!email && !name) {
      return NextResponse.json({ ok: false, error: 'email or name required' }, { status: 400 });
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

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, data: data?.[0] ?? null });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
