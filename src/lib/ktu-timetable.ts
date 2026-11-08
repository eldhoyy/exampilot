/**
 * KTU B.Tech timetable coverage and source validation helpers.
 *
 * The university timetable page is the authority. Discovery feeds and search
 * results may identify candidate notices, but never make a timetable verified.
 */
export const KTU_TIMETABLE_PORTAL = "https://ktu.edu.in/exam/Timetable";
export const KTU_ACADEMIC_CALENDAR = "https://ktu.edu.in/academics/academic_calendar";

export const KTU_BTECH_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const KTU_BTECH_SCHEMES = [2019, 2024] as const;

export type KtuTimetableCandidate = {
  title: string;
  noticeUrl: string;
  documentUrl?: string | null;
  publishedAt?: string | null;
  semester?: number | null;
  schemeYear?: number | null;
};

const OFFICIAL_KTU_HOSTS = new Set(["ktu.edu.in", "www.ktu.edu.in", "app.ktu.edu.in"]);

export function isOfficialKtuUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && OFFICIAL_KTU_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/** Accept only B.Tech semester/scheme combinations supported by the catalogue. */
export function isSupportedBtechScope(semester: number, schemeYear: number): boolean {
  return KTU_BTECH_SEMESTERS.includes(semester as (typeof KTU_BTECH_SEMESTERS)[number])
    && KTU_BTECH_SCHEMES.includes(schemeYear as (typeof KTU_BTECH_SCHEMES)[number]);
}

/**
 * Do not mark documents verified from title matching alone. The importer must
 * verify the PDF/document against an official KTU publication and retain its
 * URL, SHA-256, publication date and revision label before publishing events.
 */
export function canPromoteCandidate(candidate: KtuTimetableCandidate): boolean {
  return Boolean(
    candidate.title.trim()
    && isOfficialKtuUrl(candidate.noticeUrl)
    && candidate.documentUrl
    && isOfficialKtuUrl(candidate.documentUrl)
    && candidate.publishedAt
    && candidate.semester
    && candidate.schemeYear
    && isSupportedBtechScope(candidate.semester, candidate.schemeYear),
  );
}
