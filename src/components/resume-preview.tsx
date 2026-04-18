import { forwardRef } from "react";
import { type ResumeData, type SectionId, type TemplateId, shortUrl, ensureProtocol } from "@/lib/resume";
import {
  Mail, Phone, MapPin, User2, Wrench, FolderGit2, Briefcase, GraduationCap,
  Linkedin, Github, Globe, ExternalLink,
} from "lucide-react";

type Props = { data: ResumeData };

const SECTION_TITLE: Record<SectionId, string> = {
  summary: "Summary", skills: "Skills", projects: "Projects",
  experience: "Experience", education: "Education",
};
const SECTION_ICON: Record<SectionId, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  summary: User2, skills: Wrench, projects: FolderGit2,
  experience: Briefcase, education: GraduationCap,
};

export const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const Tpl = pickTemplate(data.template);
  return (
    <div
      ref={ref}
      data-resume-root
      data-template={data.template}
      className="resume-container pdf-page mx-auto overflow-hidden shadow-2xl"
      style={{
        width: "794px",
        height: "1123px",
        minWidth: "794px",
        maxWidth: "794px",
        minHeight: "1123px",
        maxHeight: "1123px",
        backgroundColor: "#ffffff",
        color: "#111827",
        fontFamily: "Inter, sans-serif",
        lineHeight: 1.5,
        boxSizing: "border-box",
        position: "relative",
        breakInside: "avoid",
        pageBreakInside: "avoid",
      }}
    >
      <Tpl data={data} />
    </div>
  );
});
ResumePreview.displayName = "ResumePreview";

function pickTemplate(id: TemplateId) {
  switch (id) {
    case "sidebar": return SidebarTemplate;
    case "creative": return CreativeTemplate;
    case "classic": return ClassicTemplate;
    case "minimal": return MinimalTemplate;
    case "compact": return CompactTemplate;
    case "modern":
    default: return ModernTemplate;
  }
}

/* ---------------- shared bits ---------------- */

function Photo({ src, size = 84, ring = "#e5e7eb" }: { src?: string; size?: number; ring?: string }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt="Profile"
      style={{
        width: size, height: size, borderRadius: "9999px",
        objectFit: "cover", border: `3px solid ${ring}`,
        flexShrink: 0,
      }}
    />
  );
}

function ContactRow({ data, color = "#4b5563", linkColor }: { data: ResumeData; color?: string; linkColor?: string }) {
  const lc = linkColor ?? color;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 12, color, lineHeight: 1.5 }}>
      {data.email && (
        <a href={`mailto:${data.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, color, textDecoration: "none" }}>
          <Mail style={{ width: 12, height: 12 }} />{data.email}
        </a>
      )}
      {data.phone && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Phone style={{ width: 12, height: 12 }} />{data.phone}</span>}
      {data.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MapPin style={{ width: 12, height: 12 }} />{data.location}</span>}
      {data.linkedin && (
        <a href={ensureProtocol(data.linkedin)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: lc, textDecoration: "none" }}>
          <Linkedin style={{ width: 12, height: 12 }} />{shortUrl(data.linkedin)}
        </a>
      )}
      {data.github && (
        <a href={ensureProtocol(data.github)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: lc, textDecoration: "none" }}>
          <Github style={{ width: 12, height: 12 }} />{shortUrl(data.github)}
        </a>
      )}
      {data.website && (
        <a href={ensureProtocol(data.website)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: lc, textDecoration: "none" }}>
          <Globe style={{ width: 12, height: 12 }} />{shortUrl(data.website)}
        </a>
      )}
    </div>
  );
}

function ProjectLinks({ p, color }: { p: { github?: string; demo?: string }; color: string }) {
  if (!p.github && !p.demo) return null;
  return (
    <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: "2px 14px", fontSize: 11.5 }}>
      {p.github && (
        <a href={ensureProtocol(p.github)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, color, textDecoration: "none", fontWeight: 500 }}>
          <Github style={{ width: 11, height: 11 }} /> GitHub: {shortUrl(p.github)}
        </a>
      )}
      {p.demo && (
        <a href={ensureProtocol(p.demo)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, color, textDecoration: "none", fontWeight: 500 }}>
          <ExternalLink style={{ width: 11, height: 11 }} /> Live: {shortUrl(p.demo)}
        </a>
      )}
    </div>
  );
}

function SectionTitle({
  id, color, showIcons, underline = true, size = 13,
}: { id: SectionId; color: string; showIcons: boolean; underline?: boolean; size?: number }) {
  const Icon = SECTION_ICON[id];
  return (
    <div style={{ marginBottom: 8 }}>
      <h2 style={{
        fontSize: size, fontWeight: 700, letterSpacing: "0.16em",
        textTransform: "uppercase", color,
        display: "inline-flex", alignItems: "center", gap: 6,
        margin: 0,
      }}>
        {showIcons && <Icon style={{ width: 14, height: 14 }} />}
        {SECTION_TITLE[id]}
      </h2>
      {underline && <div style={{ height: 2, background: color, marginTop: 4, width: 32, borderRadius: 2 }} />}
    </div>
  );
}

function renderBody(id: SectionId, data: ResumeData, opts: { compact?: boolean; color?: string } = {}) {
  const fs = opts.compact ? 12 : 13;
  const sub = opts.compact ? 11 : 12;
  switch (id) {
    case "summary":
      return data.summary ? (
        <p style={{ fontSize: fs, lineHeight: 1.55, color: "#374151", margin: 0 }}>{data.summary}</p>
      ) : null;
    case "skills":
      return data.skills.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {data.skills.map((s) => (
            <span key={s} style={{
              fontSize: sub, padding: "3px 9px", borderRadius: 4,
              background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#1f2937",
            }}>{s}</span>
          ))}
        </div>
      ) : null;
    case "projects":
      return data.projects.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.projects.map((p, i) => (
            <div key={i}>
              <h3 style={{ fontSize: fs + 1, fontWeight: 600, margin: 0, color: "#111827" }}>{p.title || "Untitled Project"}</h3>
              {p.description && <p style={{ fontSize: fs, lineHeight: 1.55, color: "#374151", margin: "3px 0 0" }}>{p.description}</p>}
              {p.tech && <p style={{ fontSize: sub, color: "#4b5563", margin: "3px 0 0" }}><span style={{ fontWeight: 600 }}>Tech:</span> {p.tech}</p>}
              <ProjectLinks p={p} color={opts.color ?? data.primaryColor ?? "#111827"} />
            </div>
          ))}
        </div>
      ) : null;
    case "experience":
      return data.experience.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.experience.map((e, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <h3 style={{ fontSize: fs + 1, fontWeight: 600, margin: 0, color: "#111827" }}>
                  {e.role}
                  {e.company && <span style={{ fontWeight: 400, color: "#4b5563" }}> — {e.company}</span>}
                </h3>
                {e.duration && <span style={{ fontSize: sub, color: "#6b7280", whiteSpace: "nowrap" }}>{e.duration}</span>}
              </div>
              {e.description && <p style={{ fontSize: fs, lineHeight: 1.55, color: "#374151", margin: "3px 0 0" }}>{e.description}</p>}
            </div>
          ))}
        </div>
      ) : null;
    case "education":
      return data.education.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.education.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <div>
                <h3 style={{ fontSize: fs + 1, fontWeight: 600, margin: 0, color: "#111827" }}>{e.school}</h3>
                {e.degree && <p style={{ fontSize: fs, color: "#374151", margin: "2px 0 0" }}>{e.degree}</p>}
              </div>
              {e.year && <span style={{ fontSize: sub, color: "#6b7280", whiteSpace: "nowrap" }}>{e.year}</span>}
            </div>
          ))}
        </div>
      ) : null;
  }
}

/* ---------------- 1. Modern Professional ---------------- */

function ModernTemplate({ data }: Props) {
  const c = data.primaryColor;
  return (
    <div style={{ padding: "44px 52px", fontFamily: "Inter, sans-serif" }}>
      <header style={{ display: "flex", gap: 20, alignItems: "center", paddingBottom: 14, borderBottom: `3px solid ${c}` }}>
        {data.photo && <Photo src={data.photo} ring={c} />}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1, margin: 0, color: "#111827", letterSpacing: "-0.02em" }}>
            {data.name || "Your Name"}
          </h1>
          {data.role && <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 500, color: c }}>{data.role}</p>}
          <div style={{ marginTop: 8 }}><ContactRow data={data} /></div>
        </div>
      </header>
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        {data.sectionOrder.map((id) => {
          const body = renderBody(id, data);
          if (!body) return null;
          return (
            <section key={id}>
              <SectionTitle id={id} color={c} showIcons={data.showIcons} />
              {body}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- 2. Sidebar Profile ---------------- */

function SidebarTemplate({ data }: Props) {
  const sidebarIds: SectionId[] = ["skills", "education"];
  const mainIds = data.sectionOrder.filter((id) => !sidebarIds.includes(id));
  const c = data.primaryColor;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "34% 1fr", height: "100%" }}>
      <aside style={{ background: c, color: "#ffffff", padding: "32px 22px" }}>
        {data.photo && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Photo src={data.photo} size={96} ring="#ffffff" />
          </div>
        )}
        <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15, margin: 0, color: "#ffffff" }}>
          {data.name || "Your Name"}
        </h1>
        {data.role && <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.85)" }}>{data.role}</p>}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6, fontSize: 11.5, color: "rgba(255,255,255,0.92)" }}>
          {data.email && <a href={`mailto:${data.email}`} style={{ display: "flex", alignItems: "center", gap: 6, color: "inherit", textDecoration: "none" }}><Mail style={{ width: 12, height: 12 }} /><span style={{ wordBreak: "break-all" }}>{data.email}</span></a>}
          {data.phone && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone style={{ width: 12, height: 12 }} />{data.phone}</div>}
          {data.location && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin style={{ width: 12, height: 12 }} />{data.location}</div>}
          {data.linkedin && <a href={ensureProtocol(data.linkedin)} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "inherit", textDecoration: "none", wordBreak: "break-all" }}><Linkedin style={{ width: 12, height: 12 }} />{shortUrl(data.linkedin)}</a>}
          {data.github && <a href={ensureProtocol(data.github)} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "inherit", textDecoration: "none", wordBreak: "break-all" }}><Github style={{ width: 12, height: 12 }} />{shortUrl(data.github)}</a>}
          {data.website && <a href={ensureProtocol(data.website)} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "inherit", textDecoration: "none", wordBreak: "break-all" }}><Globe style={{ width: 12, height: 12 }} />{shortUrl(data.website)}</a>}
        </div>
        {data.skills.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 8px", color: "#ffffff" }}>Skills</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {data.skills.map((s) => (
                <span key={s} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,0.15)", color: "#ffffff" }}>{s}</span>
              ))}
            </div>
          </div>
        )}
        {data.education.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 8px", color: "#ffffff" }}>Education</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.education.map((e, i) => (
                <div key={i}>
                  <p style={{ fontSize: 12.5, fontWeight: 600, margin: 0, color: "#ffffff" }}>{e.school}</p>
                  {e.degree && <p style={{ fontSize: 11, margin: "2px 0 0", color: "rgba(255,255,255,0.85)" }}>{e.degree}</p>}
                  {e.year && <p style={{ fontSize: 10.5, margin: "1px 0 0", color: "rgba(255,255,255,0.7)" }}>{e.year}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
      <main style={{ padding: "32px 28px", color: "#111827" }}>
        {mainIds.map((id) => {
          const body = renderBody(id, data);
          if (!body) return null;
          return (
            <section key={id} style={{ marginBottom: 16 }}>
              <SectionTitle id={id} color={c} showIcons={data.showIcons} />
              {body}
            </section>
          );
        })}
      </main>
    </div>
  );
}

/* ---------------- 3. Creative Card Layout ---------------- */

function CreativeTemplate({ data }: Props) {
  const c = data.primaryColor;
  const tint = hexWithAlpha(c, 0.08);
  return (
    <div style={{ background: tint, padding: 24, fontFamily: "Inter, sans-serif" }}>
      <header style={{ background: "#ffffff", borderRadius: 18, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", display: "flex", gap: 16, alignItems: "center" }}>
        {data.photo && <Photo src={data.photo} ring={c} />}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, color: "#111827", letterSpacing: "-0.02em" }}>
            {data.name || "Your Name"}
          </h1>
          {data.role && <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600, color: c }}>{data.role}</p>}
          <div style={{ marginTop: 10 }}><ContactRow data={data} /></div>
        </div>
        <div style={{ background: c, color: "#ffffff", padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>CV</div>
      </header>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {data.sectionOrder.map((id) => {
          const body = renderBody(id, data);
          if (!body) return null;
          return (
            <section key={id} style={{ background: "#ffffff", borderRadius: 16, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <SectionTitle id={id} color={c} showIcons={data.showIcons} underline={false} />
              {body}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- 4. Classic ATS (B&W, no icons, no color) ---------------- */

function ClassicTemplate({ data }: Props) {
  return (
    <div style={{ padding: "48px 56px", fontFamily: "'Times New Roman', serif", color: "#000000" }}>
      <header style={{ textAlign: "center", marginBottom: 14 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "0.04em" }}>
          {(data.name || "Your Name").toUpperCase()}
        </h1>
        {data.role && <p style={{ margin: "4px 0 0", fontSize: 13, fontStyle: "italic" }}>{data.role}</p>}
        <p style={{ margin: "6px 0 0", fontSize: 12 }}>
          {[data.email, data.phone, data.location].filter(Boolean).join("  |  ")}
        </p>
        {(data.linkedin || data.github || data.website) && (
          <p style={{ margin: "3px 0 0", fontSize: 12 }}>
            {[
              data.linkedin && <a key="li" href={ensureProtocol(data.linkedin)} style={{ color: "#000", textDecoration: "underline" }}>{shortUrl(data.linkedin)}</a>,
              data.github && <a key="gh" href={ensureProtocol(data.github)} style={{ color: "#000", textDecoration: "underline" }}>{shortUrl(data.github)}</a>,
              data.website && <a key="w" href={ensureProtocol(data.website)} style={{ color: "#000", textDecoration: "underline" }}>{shortUrl(data.website)}</a>,
            ].filter(Boolean).reduce<React.ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, "  |  ", el], [])}
          </p>
        )}
      </header>
      <div style={{ height: 1, background: "#000", margin: "8px 0 14px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.sectionOrder.map((id) => {
          const body = renderBody(id, data, { color: "#000" });
          if (!body) return null;
          return (
            <section key={id}>
              <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 4px", color: "#000" }}>
                {SECTION_TITLE[id]}
              </h2>
              <div style={{ height: 1, background: "#000", marginBottom: 8 }} />
              {body}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- 5. Minimal Elegant ---------------- */

function MinimalTemplate({ data }: Props) {
  const c = data.primaryColor;
  return (
    <div style={{ padding: "60px 72px", fontFamily: "Inter, sans-serif" }}>
      <header style={{ textAlign: "center", marginBottom: 26 }}>
        {data.photo && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <Photo src={data.photo} size={88} ring={c} />
          </div>
        )}
        <h1 style={{ fontSize: 30, fontWeight: 300, letterSpacing: "0.18em", margin: 0, color: "#111827", textTransform: "uppercase" }}>
          {data.name || "Your Name"}
        </h1>
        {data.role && <p style={{ margin: "8px 0 0", fontSize: 13, color: c, letterSpacing: "0.06em" }}>{data.role}</p>}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <div style={{ height: 1, width: 56, background: c }} />
        </div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
          <ContactRow data={data} />
        </div>
      </header>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {data.sectionOrder.map((id) => {
          const body = renderBody(id, data);
          if (!body) return null;
          return (
            <section key={id}>
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0, color: "#111827" }}>
                  {SECTION_TITLE[id]}
                </h2>
                <div style={{ height: 1, width: 28, background: c, margin: "6px auto 0" }} />
              </div>
              {body}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- 6. Compact One-Page ---------------- */

function CompactTemplate({ data }: Props) {
  const c = data.primaryColor;
  return (
    <div style={{ padding: "28px 36px", fontFamily: "Inter, sans-serif" }}>
      <header style={{ display: "flex", gap: 14, alignItems: "center", paddingBottom: 8, borderBottom: `2px solid ${c}` }}>
        {data.photo && <Photo src={data.photo} size={64} ring={c} />}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#111827", letterSpacing: "-0.02em" }}>
              {data.name || "Your Name"}
            </h1>
            {data.role && <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: c }}>{data.role}</p>}
          </div>
          <div style={{ marginTop: 4 }}><ContactRow data={data} /></div>
        </div>
      </header>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9 }}>
        {data.sectionOrder.map((id) => {
          const body = renderBody(id, data, { compact: true });
          if (!body) return null;
          return (
            <section key={id}>
              <SectionTitle id={id} color={c} showIcons={data.showIcons} underline={false} size={11} />
              {body}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- utils ---------------- */

function hexWithAlpha(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16);
  const g = parseInt(m.substring(2, 4), 16);
  const b = parseInt(m.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
