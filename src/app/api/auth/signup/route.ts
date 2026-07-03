import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Email and password are required. Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message || "Unable to create user." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
