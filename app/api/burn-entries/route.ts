import { NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/utils/auth";

export async function GET() {
  const user = await requireUser();
  if (isAuthError(user)) return user;
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function POST() {
  const user = await requireUser();
  if (isAuthError(user)) return user;
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
