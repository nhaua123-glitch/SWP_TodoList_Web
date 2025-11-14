import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.OAUTH_REDIRECT_URI;

  console.log('Env vars:', {
  clientId: process.env.GOOGLE_CLIENT_ID ? '✅' : '❌',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ? '✅' : '❌',
  redirectUri: process.env.OAUTH_REDIRECT_URI
});

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: 'Missing Google OAuth env vars' }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ],
  });

  return NextResponse.redirect(authUrl);
}


