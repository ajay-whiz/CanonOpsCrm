import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { access_token } = await req.json();
    if (!access_token) {
      return NextResponse.json({ message: 'Missing access_token' }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set('access_token', access_token, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 });
  }
}
