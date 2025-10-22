import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, external_id, meta } = body || {};
    if (!name && !external_id) {
      return NextResponse.json({ ok: false, error: 'name or external_id required' }, { status: 400 });
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

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, data: data?.[0] ?? null });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
