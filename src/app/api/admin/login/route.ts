import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { adminCookie, createAdminSessionToken } from "@/lib/admin-auth";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  }

  const configuredPassword = process.env.ADMIN_PASSWORD;
  const configuredUsername = "admin@exampilot.com";
  const configuredSecret = process.env.ADMIN_SESSION_SECRET;
  if (!configuredPassword || !configuredSecret || configuredSecret.length < 32) {
    return NextResponse.json({ error: "Admin login is not configured yet." }, { status: 503 });
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!safeEqual(username, configuredUsername) || !safeEqual(password, configuredPassword)) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(adminCookie.name, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: adminCookie.maxAge,
  });
  return response;
}
