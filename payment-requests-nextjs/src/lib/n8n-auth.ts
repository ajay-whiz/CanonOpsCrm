import { NextRequest, NextResponse } from 'next/server';

export function verifyN8NToken(req: NextRequest): { ok: true } | { ok: false; res: NextResponse } {
  const expected = process.env.N8N_SHARED_TOKEN || '';
  if (!expected) return { ok: true }; // if not configured, allow (staging convenience)
  const got = req.headers.get('x-n8n-token') || '';
  if (got && got === expected) return { ok: true };
  return { ok: false, res: NextResponse.json({ ok: false, error: 'Unauthorized (n8n)' }, { status: 401 }) };
}
