"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    const feature = featureByPath[pathname];
    if (!feature) return;

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
  }, [pathname]);

  return null;
}
