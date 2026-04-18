import { forwardRef } from "react";
import type { ResumeData, SectionId } from "@/lib/resume";
import { Mail, Phone, MapPin } from "lucide-react";

type Props = { data: ResumeData };

export const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const Tpl =
    data.template === "sidebar" ? SidebarTemplate :
    data.template === "creative" ? CreativeTemplate :
    ModernTemplate;
  return (
    <div
      ref={ref}
      className="bg-white text-neutral-900 mx-auto w-full max-w-[820px] aspect-[1/1.414] shadow-2xl overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <Tpl data={data} />
    </div>
  );
});
ResumePreview.displayName = "ResumePreview";

/* -------------------- Helpers -------------------- */

function renderSection(id: SectionId, data: ResumeData, opts: { compact?: boolean } = {}) {
  switch (id) {
    case "summary":
      return data.summary ? (
        <p className={`leading-relaxed text-neutral-700 ${opts.compact ? "text-[11px]" : "text-sm"}`}>{data.summary}</p>
      ) : null;
    case "skills":
      return data.skills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {data.skills.map((s) => (
            <span key={s} className="rounded border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-[11px]">{s}</span>
          ))}
        </div>
      ) : null;
    case "projects":
      return data.projects.length > 0 ? (
        <div className="space-y-2.5">
          {data.projects.map((p, i) => (
            <div key={i}>
              <h3 className="text-sm font-semibold">{p.title || "Untitled Project"}</h3>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-700">{p.description}</p>
            </div>
          ))}
        </div>
      ) : null;
    case "experience":
      return data.experience.length > 0 ? (
        <div className="space-y-2.5">
          {data.experience.map((e, i) => (
            <div key={i}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold">{e.role} <span className="font-normal text-neutral-600">— {e.company}</span></h3>
                <span className="text-[11px] text-neutral-500">{e.duration}</span>
              </div>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-700">{e.description}</p>
            </div>
          ))}
        </div>
      ) : null;
    case "education":
      return data.education.length > 0 ? (
        <div className="space-y-1.5">
          {data.education.map((e, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{e.school}</h3>
                <p className="text-[11.5px] text-neutral-700">{e.degree}</p>
              </div>
              <span className="text-[11px] text-neutral-500">{e.year}</span>
            </div>
          ))}
        </div>
      ) : null;
  }
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      style={{ fontFamily: "Space Grotesk, sans-serif" }}
      className={`mb-2 text-[11px] font-bold uppercase tracking-[0.18em] ${className}`}
    >
      {children}
    </h2>
  );
}

const SECTION_TITLE: Record<SectionId, string> = {
  summary: "Summary", skills: "Skills", projects: "Projects", experience: "Experience", education: "Education",
};

/* -------------------- Modern (clean, dividers) -------------------- */

function ModernTemplate({ data }: Props) {
  return (
    <div style={{ padding: "44px 52px" }}>
      <header className="border-b-2 border-neutral-900 pb-3">
        <h1 style={{ fontFamily: "Space Grotesk, sans-serif" }} className="text-[34px] font-bold tracking-tight leading-tight">
          {data.name || "Your Name"}
        </h1>
        {data.role && <p className="mt-0.5 text-sm font-medium text-neutral-700">{data.role}</p>}
        <ContactRow data={data} className="mt-2" />
      </header>
      {data.sectionOrder.map((id) => {
        const body = renderSection(id, data);
        if (!body) return null;
        return (
          <section key={id} className="mt-4 border-b border-neutral-200 pb-3 last:border-0">
            <SectionLabel className="text-neutral-900">{SECTION_TITLE[id]}</SectionLabel>
            {body}
          </section>
        );
      })}
    </div>
  );
}

/* -------------------- Sidebar (left dark sidebar) -------------------- */

function SidebarTemplate({ data }: Props) {
  const sidebarIds: SectionId[] = ["skills", "education"];
  const mainIds = data.sectionOrder.filter((id) => !sidebarIds.includes(id));
  return (
    <div className="grid h-full grid-cols-[34%_1fr]">
      <aside className="bg-neutral-900 p-6 text-neutral-100">
        <h1 style={{ fontFamily: "Space Grotesk, sans-serif" }} className="text-[24px] font-bold leading-tight">
          {data.name || "Your Name"}
        </h1>
        {data.role && <p className="mt-1 text-[12px] text-neutral-300">{data.role}</p>}
        <div className="mt-4 space-y-1.5 text-[11px] text-neutral-300">
          {data.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{data.email}</div>}
          {data.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{data.phone}</div>}
          {data.location && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{data.location}</div>}
        </div>
        {data.skills.length > 0 && (
          <div className="mt-5">
            <SectionLabel className="text-neutral-100">Skills</SectionLabel>
            <div className="flex flex-wrap gap-1">
              {data.skills.map((s) => (
                <span key={s} className="rounded bg-neutral-800 px-2 py-0.5 text-[10.5px] text-neutral-100">{s}</span>
              ))}
            </div>
          </div>
        )}
        {data.education.length > 0 && (
          <div className="mt-5">
            <SectionLabel className="text-neutral-100">Education</SectionLabel>
            <div className="space-y-1.5">
              {data.education.map((e, i) => (
                <div key={i}>
                  <p className="text-[12px] font-semibold">{e.school}</p>
                  <p className="text-[10.5px] text-neutral-400">{e.degree}</p>
                  <p className="text-[10px] text-neutral-500">{e.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
      <main className="p-6 text-neutral-900">
        {mainIds.map((id) => {
          const body = renderSection(id, data);
          if (!body) return null;
          return (
            <section key={id} className="mb-4">
              <SectionLabel className="text-neutral-900">{SECTION_TITLE[id]}</SectionLabel>
              {body}
            </section>
          );
        })}
      </main>
    </div>
  );
}

/* -------------------- Creative (cards) -------------------- */

function CreativeTemplate({ data }: Props) {
  return (
    <div className="bg-amber-50/60 p-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif" }} className="text-[30px] font-bold leading-tight tracking-tight">
              {data.name || "Your Name"}
            </h1>
            {data.role && <p className="mt-0.5 text-sm font-medium text-amber-700">{data.role}</p>}
          </div>
          <div className="rounded-full bg-amber-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-900">CV</div>
        </div>
        <ContactRow data={data} className="mt-3" />
      </header>
      <div className="mt-3 grid grid-cols-1 gap-3">
        {data.sectionOrder.map((id) => {
          const body = renderSection(id, data);
          if (!body) return null;
          return (
            <section key={id} className="rounded-2xl bg-white p-4 shadow-sm">
              <SectionLabel className="text-amber-900">{SECTION_TITLE[id]}</SectionLabel>
              {body}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ContactRow({ data, className = "" }: { data: ResumeData; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-600 ${className}`}>
      {data.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3" />{data.email}</span>}
      {data.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" />{data.phone}</span>}
      {data.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" />{data.location}</span>}
    </div>
  );
}
