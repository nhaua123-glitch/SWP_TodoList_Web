import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("set-status body:", body);

    const status = body?.status;
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => Promise.resolve(cookieStore) });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    if (!status) {
      return NextResponse.json({ error: "missing status" }, { status: 400 });
    }

    const { error } = await supabase.from("user_status").upsert({
      user_id: user.id,
      status,
      last_seen: new Date().toISOString(),
    });

    if (error) {
      console.error("supabase upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("set-status error:", err);
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
}

