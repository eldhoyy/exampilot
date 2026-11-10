export type Difficulty = "easy" | "medium" | "hard";
export type StudySubject = {
  id: string;
  title: string;
  examDate: string;
  difficulty: Difficulty;
  modules: number;
  completedModules: number;
};
export type StudySession = {
  date: string;
  subjectId: string;
  subject: string;
  minutes: number;
  reason: string;
};

const weight: Record<Difficulty, number> = { easy: 1, medium: 1.35, hard: 1.75 };

// Uses local calendar dates (not UTC) and schedules across the full period
// from today through the last examination, rather than an arbitrary 30 days.
export function localDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildStudyPlan(
  subjects: StudySubject[],
  dailyMinutes = 240,
  from = new Date(),
  focusMinutes = 50,
  breakMinutes = 10,
): StudySession[] {
  const today = localDateISO(from);
  const valid = subjects
    .filter((s) => s.title && s.examDate >= today && s.modules > s.completedModules)
    .map((s) => ({ ...s, remaining: Math.max(1, s.modules - s.completedModules) }));
  if (!valid.length) return [];

  const lastExam = valid.reduce((latest, s) => s.examDate > latest ? s.examDate : latest, today);
  const sessions: StudySession[] = [];
  const remaining = new Map(valid.map((s) => [s.id, s.remaining]));

  for (let day = new Date(from.getFullYear(), from.getMonth(), from.getDate()); localDateISO(day) <= lastExam; day.setDate(day.getDate() + 1)) {
    const date = localDateISO(day);
    let budget = dailyMinutes;
    while (budget >= Math.min(25, focusMinutes)) {
      const candidates = valid.filter((s) => (remaining.get(s.id) || 0) > 0 && s.examDate > date);
      if (!candidates.length) break;
      candidates.sort((a, b) => {
        const daysA = Math.max(0.25, (new Date(a.examDate + "T23:59:59").getTime() - day.getTime()) / 86400000);
        const daysB = Math.max(0.25, (new Date(b.examDate + "T23:59:59").getTime() - day.getTime()) / 86400000);
        const scoreA = (weight[a.difficulty] * (remaining.get(a.id) || 0)) / daysA;
        const scoreB = (weight[b.difficulty] * (remaining.get(b.id) || 0)) / daysB;
        return scoreB - scoreA;
      });
      const chosen = candidates[0];
      const minutes = Math.min(focusMinutes, budget);
      sessions.push({
        date,
        subjectId: chosen.id,
        subject: chosen.title,
        minutes,
        reason: `${chosen.difficulty} priority · ${remaining.get(chosen.id)} study blocks remaining · exam ${chosen.examDate}`,
      });
      remaining.set(chosen.id, (remaining.get(chosen.id) || 1) - 1);
      budget -= minutes + breakMinutes;
    }
  }
  return sessions;
}
