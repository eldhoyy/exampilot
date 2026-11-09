/**
 * KTU B.Tech timetable coverage and source validation helpers.
 *
 * KTU-issued documents are the authority. Trusted publishers may distribute
 * those documents, but publisher identity is not the same as KTU endorsement.
 * Discovery feeds and search results never make a timetable verified.
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
const TRUSTED_DISCOVERY_PUBLISHERS = new Set(["ktunotes.in", "www.ktunotes.in", "ktunotes.live", "www.ktunotes.live", "timetable.ktunotes.live", "ktumagic.in", "www.ktumagic.in", "sac.ksucet.in"]);
const TRUSTED_DOCUMENT_HOSTS = new Set([...TRUSTED_DISCOVERY_PUBLISHERS, "objectstorage.ap-hyderabad-1.oraclecloud.com"]);

export type KtuDocumentEvidence = {
  documentSha256?: string | null;
  documentNumber?: string | null;
  documentDate?: string | null;
  pdfSemester?: number | null;
  pdfSchemeYear?: number | null;
  humanApproved?: boolean;
};

export function isTrustedKtuDiscoveryPublisher(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && TRUSTED_DISCOVERY_PUBLISHERS.has(url.hostname);
  } catch {
    return false;
  }
}

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
 * Promotion is deliberately strict. A trusted third-party notice page may
 * distribute a KTU-issued PDF, but only matching document evidence plus an
 * explicit human approval can permit the next verification step.
 */
export function canPromoteCandidate(
  candidate: KtuTimetableCandidate,
  evidence: KtuDocumentEvidence,
): boolean {
  const trustedNotice = isTrustedKtuDiscoveryPublisher(candidate.noticeUrl);
  const documentUrl = candidate.documentUrl;
  const validDocumentUrl = typeof documentUrl === "string" && (() => {
    try { const url = new URL(documentUrl); return url.protocol === "https:" && url.hostname !== null && TRUSTED_DOCUMENT_HOSTS.has(url.hostname); }
    catch { return false; }
  })();
  return Boolean(
    candidate.title.trim()
    && trustedNotice
    && validDocumentUrl
    && evidence.documentSha256?.match(/^[a-f0-9]{64}$/i)
    && evidence.documentNumber?.match(/^KTU\s*\//i)
    && evidence.documentDate
    && candidate.semester
    && candidate.schemeYear
    && isSupportedBtechScope(candidate.semester, candidate.schemeYear)
    && evidence.pdfSemester === candidate.semester
    && evidence.pdfSchemeYear === candidate.schemeYear
    && evidence.humanApproved === true,
  );
}
