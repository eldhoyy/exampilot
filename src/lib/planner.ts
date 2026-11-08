export type Difficulty = "easy" | "medium" | "hard";
export type StudySubject = { id: string; title: string; examDate: string; difficulty: Difficulty; modules: number; completedModules: number };
export type StudySession = { date: string; subjectId: string; subject: string; minutes: number; reason: string };

const weight: Record<Difficulty, number> = { easy: 1, medium: 1.35, hard: 1.75 };

export function buildStudyPlan(subjects: StudySubject[], dailyMinutes = 240, from = new Date()): StudySession[] {
  const valid = subjects.filter(s => Number.isFinite(Date.parse(s.examDate)) && s.modules > s.completedModules);
  const sessions: StudySession[] = [];
  const remaining = valid.map(s => ({ ...s, remaining: s.modules - s.completedModules }));
  for (let offset = 0; offset < 30; offset++) {
    const day = new Date(from);
    day.setDate(day.getDate() + offset);
    const date = day.toISOString().slice(0, 10);
    let budget = dailyMinutes;
    while (budget >= 45) {
      const candidates = remaining.filter(s => s.remaining > 0 && Date.parse(s.examDate + "T23:59:59") >= day.getTime());
      if (!candidates.length) break;
      candidates.sort((a,b) => {
        const urgencyA = 1 / Math.max(1, (Date.parse(a.examDate) - day.getTime()) / 86400000);
        const urgencyB = 1 / Math.max(1, (Date.parse(b.examDate) - day.getTime()) / 86400000);
        const scoreA = urgencyA * weight[a.difficulty] * a.remaining;
        const scoreB = urgencyB * weight[b.difficulty] * b.remaining;
        return scoreB - scoreA;
      });
      const chosen = candidates[0];
      const minutes = Math.min(60, budget);
      sessions.push({ date, subjectId: chosen.id, subject: chosen.title, minutes, reason: chosen.difficulty + " priority · " + chosen.remaining + " modules remaining" });
      chosen.remaining -= 1;
      budget -= minutes + 10;
    }
  }
  return sessions;
}
