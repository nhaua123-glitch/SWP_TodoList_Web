import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return NextResponse.json({ id: null, error: error.message }, { status: 200 });
    }

    if (!user) {
      return NextResponse.json({ id: null }, { status: 200 });
    }

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (err: any) {
    return NextResponse.json({ id: null, error: "Internal Server Error" }, { status: 500 });
  }
}
