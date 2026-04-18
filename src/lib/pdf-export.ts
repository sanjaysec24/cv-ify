import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Unified A4 PDF export. Renders the resume preview node at its true
 * 794x1123 size, fits it onto a single A4 page, and overlays clickable
 * link annotations. Works consistently across all templates.
 */
export async function exportResumePdf(name: string) {
  const node = document.querySelector<HTMLElement>("[data-resume-root]");
  if (!node) throw new Error("Resume preview not found");

  // Neutralize any zoom/scale transforms on ancestors (builder preview zoom)
  const transformedAncestors: { el: HTMLElement; transform: string; marginBottom: string }[] = [];
  let pAnc: HTMLElement | null = node.parentElement;
  while (pAnc && pAnc !== document.body) {
    const t = pAnc.style.transform;
    if (t && t.includes("scale")) {
      transformedAncestors.push({ el: pAnc, transform: t, marginBottom: pAnc.style.marginBottom });
      pAnc.style.transform = "none";
      pAnc.style.marginBottom = "0px";
    }
    pAnc = pAnc.parentElement;
  }
  document.documentElement.classList.add("pdf-exporting");

  await new Promise((r) => requestAnimationFrame(() => r(null)));

  // Sanitize unsupported CSS color functions inside the cloned doc
  const sanitizeColors = (clonedDoc: Document) => {
    const UNSUPPORTED = /(oklch|oklab|color\(|color-mix|lch|lab|hwb)\(/i;
    const PROPS = [
      "color", "backgroundColor",
      "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor",
      "outlineColor", "fill", "stroke",
    ] as const;
    const toRgb = (value: string): string | null => {
      const probe = clonedDoc.createElement("span");
      probe.style.color = value;
      clonedDoc.body.appendChild(probe);
      const resolved = clonedDoc.defaultView?.getComputedStyle(probe).color || "";
      probe.remove();
      return resolved && !UNSUPPORTED.test(resolved) ? resolved : null;
    };
    clonedDoc.querySelectorAll<HTMLElement>("*").forEach((el) => {
      const cs = clonedDoc.defaultView?.getComputedStyle(el);
      if (!cs) return;
      for (const prop of PROPS) {
        const val = cs[prop as keyof CSSStyleDeclaration] as string | undefined;
        if (val && UNSUPPORTED.test(val)) {
          const rgb = toRgb(val);
          (el.style as unknown as Record<string, string>)[prop] =
            rgb ?? (prop === "color" ? "#111111" : "transparent");
        }
      }
      if (cs.backgroundImage && UNSUPPORTED.test(cs.backgroundImage)) {
        el.style.backgroundImage = "none";
      }
    });
    // Lock the resume root to exact A4 px dimensions in the clone
    const root = clonedDoc.querySelector<HTMLElement>("[data-resume-root]");
    if (root) {
      root.style.width = "794px";
      root.style.height = "1123px";
      root.style.minWidth = "794px";
      root.style.maxWidth = "794px";
      root.style.minHeight = "1123px";
      root.style.maxHeight = "1123px";
      root.style.overflow = "hidden";
      root.style.boxShadow = "none";
      root.style.margin = "0";
      root.style.transform = "none";
    }
  };

  try {
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123,
      onclone: (clonedDoc) => sanitizeColors(clonedDoc),
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();   // 210
    const pageH = pdf.internal.pageSize.getHeight();  // 297

    // Always fit the captured A4 canvas onto a single A4 page
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pageW, pageH);

    // Overlay clickable links — map from the live 794x1123 node to mm
    const nodeRect = node.getBoundingClientRect();
    const mmPerPx = pageW / 794;
    const anchors = Array.from(node.querySelectorAll<HTMLAnchorElement>("a[href]"));
    for (const a of anchors) {
      const r = a.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const x = (r.left - nodeRect.left) * mmPerPx;
      const y = (r.top - nodeRect.top) * mmPerPx;
      const w = r.width * mmPerPx;
      const h = r.height * mmPerPx;
      pdf.link(x, y, w, h, { url: a.href });
    }

    pdf.save(`${name || "resume"}.pdf`);
  } finally {
    document.documentElement.classList.remove("pdf-exporting");
    for (const t of transformedAncestors) {
      t.el.style.transform = t.transform;
      t.el.style.marginBottom = t.marginBottom;
    }
  }
}
