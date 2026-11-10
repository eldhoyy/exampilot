"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const featureByPath: Record<string, string> = {
  "/": "home",
  "/study-plan": "study_plan",
  "/timetable": "timetable",
  "/study-materials": "study_materials",
  "/ai-tutor": "ai_tutor",
  "/subjects": "subjects",
  "/onboarding": "onboarding",
};

export default function ActivityTracker() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<"unknown" | "yes" | "no">("unknown");

  useEffect(() => {
    const saved = localStorage.getItem("exampilot-analytics-consent");
    if (saved === "yes" || saved === "no") setConsent(saved);
  }, []);

  useEffect(() => {
    const feature = featureByPath[pathname];
    if (!feature || consent !== "yes") return;

    try {
      const storageKey = "exampilot-visitor-id";
      let visitorId = localStorage.getItem(storageKey);
      if (!visitorId || !/^[0-9a-f-]{36}$/i.test(visitorId)) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(storageKey, visitorId);
      }

      let profile: Record<string, unknown> = {};
      const rawProfile = localStorage.getItem("exampilot-profile-draft");
      if (rawProfile) {
        try { profile = JSON.parse(rawProfile) as Record<string, unknown>; } catch { profile = {}; }
      }

      void fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          visitor_id: visitorId,
          display_name: profile.name,
          branch: profile.branch,
          semester: profile.semester,
          feature,
          path: pathname,
        }),
      }).catch(() => undefined);
    } catch {
      // Analytics must never prevent the study tools from working.
    }
  }, [pathname, consent]);

  if (consent !== "unknown") return null;

  function choose(value: "yes" | "no") {
    localStorage.setItem("exampilot-analytics-consent", value);
    setConsent(value);
  }

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/15 sm:inset-x-6 sm:bottom-6 sm:p-5" aria-label="Analytics privacy choice">
      <p className="text-sm font-bold text-[#14213d]">Help us improve ExamPilot</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">With your permission, we record the pages and features you visit, a random browser ID, and the name, branch and semester you entered in your academic profile. We do not collect passwords, study notes or AI conversations. You can decline; the website will still work normally.</p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button onClick={() => choose("no")} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">Decline</button>
        <button onClick={() => choose("yes")} className="rounded-xl bg-[#315efb] px-4 py-2 text-xs font-semibold text-white">Allow usage analytics</button>
      </div>
    </aside>
  );
}
