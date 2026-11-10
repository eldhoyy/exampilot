import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "Usage database is not configured." }, { status: 503 });

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase
    .from("usage_events")
    .select("visitor_id, display_name, branch, semester, feature, path, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) return NextResponse.json({ error: "Could not load usage data." }, { status: 500 });

  const visitors = new Map<string, {
    visitor_id: string; display_name: string | null; branch: string | null; semester: string | null;
    last_seen: string; visits: number; features: Set<string>;
  }>();
  for (const event of data ?? []) {
    const existing = visitors.get(event.visitor_id);
    if (existing) {
      existing.visits += 1;
      existing.features.add(event.feature);
      if (!existing.display_name && event.display_name) existing.display_name = event.display_name;
      if (!existing.branch && event.branch) existing.branch = event.branch;
      if (!existing.semester && event.semester) existing.semester = event.semester;
    } else {
      visitors.set(event.visitor_id, {
        visitor_id: event.visitor_id, display_name: event.display_name, branch: event.branch,
        semester: event.semester, last_seen: event.created_at, visits: 1, features: new Set([event.feature]),
      });
    }
  }

  const users = [...visitors.values()].map((visitor) => ({
    ...visitor, features: [...visitor.features],
  }));
  const featureCounts: Record<string, number> = {};
  for (const event of data ?? []) featureCounts[event.feature] = (featureCounts[event.feature] ?? 0) + 1;

  return NextResponse.json({ users, featureCounts, totalEvents: data?.length ?? 0 });
}
