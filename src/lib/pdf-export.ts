import jsPDF from "jspdf";
import type { ResumeData, SectionId } from "./resume";

const SECTION_TITLE: Record<SectionId, string> = {
  summary: "Summary", skills: "Skills", projects: "Projects", experience: "Experience", education: "Education",
};

type Ctx = {
  pdf: jsPDF;
  x: number;
  y: number;
  w: number;
  pageH: number;
  margin: number;
};

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y + needed > ctx.pageH - ctx.margin) {
    ctx.pdf.addPage();
    ctx.y = ctx.margin;
  }
}

function drawText(ctx: Ctx, text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; x?: number; w?: number; lineGap?: number } = {}) {
  const { size = 10, bold = false, color = [40, 40, 40], x = ctx.x, w = ctx.w, lineGap = 1.3 } = opts;
  ctx.pdf.setFont("helvetica", bold ? "bold" : "normal");
  ctx.pdf.setFontSize(size);
  ctx.pdf.setTextColor(color[0], color[1], color[2]);
  const lines = ctx.pdf.splitTextToSize(text, w) as string[];
  const lineH = (size * 0.3528) * lineGap;
  ensureSpace(ctx, lines.length * lineH);
  ctx.pdf.text(lines, x, ctx.y + size * 0.3528);
  ctx.y += lines.length * lineH;
}

function sectionHeader(ctx: Ctx, title: string, accent: [number, number, number] = [20, 20, 20]) {
  ensureSpace(ctx, 8);
  ctx.y += 2;
  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(9);
  ctx.pdf.setTextColor(accent[0], accent[1], accent[2]);
  ctx.pdf.text(title.toUpperCase(), ctx.x, ctx.y + 3);
  ctx.y += 4.2;
  ctx.pdf.setDrawColor(220, 220, 220);
  ctx.pdf.setLineWidth(0.2);
  ctx.pdf.line(ctx.x, ctx.y, ctx.x + ctx.w, ctx.y);
  ctx.y += 2.5;
}

function drawSection(ctx: Ctx, id: SectionId, data: ResumeData) {
  switch (id) {
    case "summary":
      if (!data.summary) return;
      sectionHeader(ctx, SECTION_TITLE[id]);
      drawText(ctx, data.summary, { size: 9.5, color: [60, 60, 60] });
      break;
    case "skills":
      if (data.skills.length === 0) return;
      sectionHeader(ctx, SECTION_TITLE[id]);
      drawText(ctx, data.skills.join("  •  "), { size: 9.5, color: [60, 60, 60] });
      break;
    case "projects":
      if (data.projects.length === 0) return;
      sectionHeader(ctx, SECTION_TITLE[id]);
      data.projects.forEach((p) => {
        drawText(ctx, p.title || "Untitled Project", { size: 10.5, bold: true, color: [20, 20, 20] });
        if (p.description) drawText(ctx, p.description, { size: 9.5, color: [60, 60, 60] });
        ctx.y += 1.5;
      });
      break;
    case "experience":
      if (data.experience.length === 0) return;
      sectionHeader(ctx, SECTION_TITLE[id]);
      data.experience.forEach((e) => {
        const head = `${e.role}${e.company ? " — " + e.company : ""}`;
        drawText(ctx, head, { size: 10.5, bold: true, color: [20, 20, 20] });
        if (e.duration) drawText(ctx, e.duration, { size: 9, color: [120, 120, 120] });
        if (e.description) drawText(ctx, e.description, { size: 9.5, color: [60, 60, 60] });
        ctx.y += 1.5;
      });
      break;
    case "education":
      if (data.education.length === 0) return;
      sectionHeader(ctx, SECTION_TITLE[id]);
      data.education.forEach((e) => {
        drawText(ctx, e.school, { size: 10.5, bold: true, color: [20, 20, 20] });
        const sub = [e.degree, e.year].filter(Boolean).join("  •  ");
        if (sub) drawText(ctx, sub, { size: 9.5, color: [80, 80, 80] });
        ctx.y += 1.2;
      });
      break;
  }
}

export function exportResumePdf(data: ResumeData) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 15;

  if (data.template === "sidebar") {
    // Dark left sidebar
    const sidebarW = 60;
    pdf.setFillColor(23, 23, 23);
    pdf.rect(0, 0, sidebarW, pageH, "F");

    // Sidebar text
    pdf.setTextColor(245, 245, 245);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    const nameLines = pdf.splitTextToSize(data.name || "Your Name", sidebarW - 16) as string[];
    pdf.text(nameLines, 8, 18);
    let sy = 18 + nameLines.length * 6;
    if (data.role) {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(190, 190, 190);
      pdf.text(data.role, 8, sy); sy += 5;
    }
    pdf.setFontSize(8); pdf.setTextColor(200, 200, 200);
    [data.email, data.phone, data.location].filter(Boolean).forEach((line) => {
      const lns = pdf.splitTextToSize(line, sidebarW - 16) as string[];
      pdf.text(lns, 8, sy + 4); sy += lns.length * 3.6;
    });
    sy += 4;
    if (data.skills.length) {
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(245, 245, 245);
      pdf.text("SKILLS", 8, sy); sy += 4;
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.5); pdf.setTextColor(220, 220, 220);
      data.skills.forEach((s) => { pdf.text("• " + s, 8, sy); sy += 4; });
      sy += 2;
    }
    if (data.education.length) {
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(245, 245, 245);
      pdf.text("EDUCATION", 8, sy); sy += 4;
      data.education.forEach((e) => {
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(245, 245, 245);
        const lns = pdf.splitTextToSize(e.school, sidebarW - 16) as string[];
        pdf.text(lns, 8, sy); sy += lns.length * 4;
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(200, 200, 200);
        pdf.text(e.degree, 8, sy); sy += 3.5;
        pdf.text(e.year, 8, sy); sy += 5;
      });
    }

    // Main content
    const ctx: Ctx = { pdf, x: sidebarW + 8, y: margin, w: pageW - sidebarW - 16, pageH, margin };
    const main = data.sectionOrder.filter((id) => id !== "skills" && id !== "education");
    main.forEach((id) => drawSection(ctx, id, data));
    pdf.save(`${data.name || "resume"}.pdf`);
    return;
  }

  // Modern + Creative share text-flow layout (creative gets accent)
  const accent: [number, number, number] = data.template === "creative" ? [161, 98, 7] : [20, 20, 20];

  // Header
  pdf.setTextColor(accent[0], accent[1], accent[2]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text(data.name || "Your Name", margin, margin + 6);
  let hy = margin + 11;
  if (data.role) {
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(11); pdf.setTextColor(90, 90, 90);
    pdf.text(data.role, margin, hy); hy += 5;
  }
  const contact = [data.email, data.phone, data.location].filter(Boolean).join("   |   ");
  if (contact) {
    pdf.setFontSize(9); pdf.setTextColor(110, 110, 110);
    pdf.text(contact, margin, hy); hy += 3;
  }
  // Header rule
  pdf.setDrawColor(accent[0], accent[1], accent[2]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, hy + 1.5, pageW - margin, hy + 1.5);

  const ctx: Ctx = { pdf, x: margin, y: hy + 4, w: pageW - margin * 2, pageH, margin };
  data.sectionOrder.forEach((id) => drawSection(ctx, id, data));

  pdf.save(`${data.name || "resume"}.pdf`);
}
