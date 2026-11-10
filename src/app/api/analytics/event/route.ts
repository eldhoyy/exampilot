import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const allowedFeatures = new Set(["home", "study_plan", "timetable", "study_materials", "ai_tutor", "subjects", "onboarding"]);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  const visitorId = typeof body.visitor_id === "string" && /^[0-9a-f-]{36}$/i.test(body.visitor_id) ? body.visitor_id : "";
  const feature = typeof body.feature === "string" ? body.feature : "";
  if (!visitorId || !allowedFeatures.has(feature)) {
    return NextResponse.json({ error: "Invalid event details." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Usage tracking is not configured." }, { status: 503 });
  }

  const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : null;
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.from("usage_events").insert({
    visitor_id: visitorId,
    display_name: clean(body.display_name, 100),
    branch: clean(body.branch, 120),
    semester: clean(body.semester, 12),
    feature,
    path: clean(body.path, 200),
  });

  if (error) {
    return NextResponse.json({ error: "Could not record usage." }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 201 });
}
