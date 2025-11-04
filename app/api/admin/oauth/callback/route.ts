import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: 'Missing Google OAuth env vars' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  try {
    const { tokens } = await oauth2Client.getToken(code);
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Lưu/ghi đè token
    const { error } = await supabase
      .from('oauth_tokens')
      .upsert({
        provider: 'google',
        access_token: tokens.access_token || null,
        refresh_token: tokens.refresh_token || null,
        expiry_date: tokens.expiry_date || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'provider' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.redirect(process.env.NEXT_PUBLIC_SITE_URL || '/');
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'OAuth callback failed' }, { status: 500 });
  }
}


