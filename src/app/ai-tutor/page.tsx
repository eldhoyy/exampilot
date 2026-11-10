import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function TutorPage() {
  return (
    <main className="mx-auto max-w-2xl py-8">
      <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold muted">
        <ArrowLeft size={16}/> Dashboard
      </Link>
      <p className="eyebrow">IN THE WORKS</p>
      <h1 className="text-4xl font-bold">A better way to work through doubts.</h1>
      <p className="mt-4 max-w-xl text-base leading-7 muted">
        We&apos;re preparing a study helper that can explain KTU topics with steps and proper syllabus references.
        It isn&apos;t available yet, so there is no pretend chat here.
      </p>
      <section className="panel mt-8 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--surface-muted)] text-[var(--accent)]">
            <Mail size={20}/>
          </span>
          <div>
            <h2 className="font-bold">Want to hear when it opens?</h2>
            <p className="text-sm muted">Email updates aren&apos;t active yet. We&apos;ll add a real opt-in when the service is ready.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input type="email" disabled aria-label="Email address for future updates" placeholder="Email notifications are not available yet" className="min-h-11 flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm"/>
          <button disabled className="secondary-button opacity-60">Notify me · unavailable</button>
        </div>
      </section>
    </main>
  );
}
