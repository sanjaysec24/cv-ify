import { forwardRef } from "react";
import type { ResumeData } from "@/lib/resume";
import { Mail, Phone, MapPin } from "lucide-react";

export const ResumePreview = forwardRef<HTMLDivElement, { data: ResumeData }>(({ data }, ref) => {
  return (
    <div
      ref={ref}
      className="bg-white text-neutral-900 mx-auto w-full max-w-[820px] aspect-[1/1.414] shadow-2xl"
      style={{ padding: "48px 56px", fontFamily: "Inter, sans-serif" }}
    >
      <header className="border-b-2 border-neutral-900 pb-4">
        <h1 style={{ fontFamily: "Space Grotesk, sans-serif" }} className="text-4xl font-bold tracking-tight">
          {data.name || "Your Name"}
        </h1>
        {data.role && <p className="mt-1 text-base font-medium text-neutral-700">{data.role}</p>}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-600">
          {data.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3" />{data.email}</span>}
          {data.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" />{data.phone}</span>}
          {data.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" />{data.location}</span>}
        </div>
      </header>

      {data.summary && (
        <Section title="Summary">
          <p className="text-sm leading-relaxed text-neutral-700">{data.summary}</p>
        </Section>
      )}

      {data.skills.length > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s) => (
              <span key={s} className="rounded border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs">
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {data.projects.length > 0 && (
        <Section title="Projects">
          <div className="space-y-3">
            {data.projects.map((p, i) => (
              <div key={i}>
                <h3 className="text-sm font-semibold">{p.title || "Untitled Project"}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-700">{p.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.experience.length > 0 && (
        <Section title="Experience">
          <div className="space-y-3">
            {data.experience.map((e, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold">{e.role} <span className="font-normal text-neutral-600">— {e.company}</span></h3>
                  <span className="text-xs text-neutral-500">{e.duration}</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-700">{e.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.education.length > 0 && (
        <Section title="Education">
          <div className="space-y-2">
            {data.education.map((e, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{e.school}</h3>
                  <p className="text-xs text-neutral-700">{e.degree}</p>
                </div>
                <span className="text-xs text-neutral-500">{e.year}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
});
ResumePreview.displayName = "ResumePreview";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2
        style={{ fontFamily: "Space Grotesk, sans-serif" }}
        className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-900"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
