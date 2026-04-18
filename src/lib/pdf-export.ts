import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Renders the live resume preview node to a canvas, paginates it across
 * A4 pages in a jsPDF document, then overlays clickable link annotations
 * on top of every <a href> found inside the preview so links remain
 * interactive in the exported PDF.
 */
export async function exportResumePdf(name: string) {
  const node = document.querySelector<HTMLElement>("[data-resume-root]");
  if (!node) throw new Error("Resume preview not found");

  // Temporarily remove any zoom/scale transform on ancestors so html2canvas
  // captures the resume at its true 794x1123 size without distortion.
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
  // Allow layout to settle
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  // html2canvas can't parse modern CSS color functions like oklch()/oklab()/color().
  // Walk the cloned DOM and replace any computed color/background/border-color that
  // uses an unsupported function with its rgb() equivalent (resolved by the browser).
  const sanitizeColors = (clonedDoc: Document) => {
    const UNSUPPORTED = /(oklch|oklab|color\(|color-mix|lch|lab|hwb)\(/i;
    const PROPS = [
      "color",
      "backgroundColor",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "outlineColor",
      "fill",
      "stroke",
    ] as const;
    const toRgb = (value: string): string | null => {
      // Use the browser to resolve the color by assigning it to a detached element
      const probe = clonedDoc.createElement("span");
      probe.style.color = value;
      clonedDoc.body.appendChild(probe);
      const resolved = clonedDoc.defaultView?.getComputedStyle(probe).color || "";
      probe.remove();
      return resolved && !UNSUPPORTED.test(resolved) ? resolved : null;
    };
    const all = clonedDoc.querySelectorAll<HTMLElement>("*");
    all.forEach((el) => {
      const cs = clonedDoc.defaultView?.getComputedStyle(el);
      if (!cs) return;
      for (const prop of PROPS) {
        const val = cs[prop as keyof CSSStyleDeclaration] as string | undefined;
        if (val && UNSUPPORTED.test(val)) {
          const rgb = toRgb(val);
          if (rgb) (el.style as unknown as Record<string, string>)[prop] = rgb;
          else (el.style as unknown as Record<string, string>)[prop] =
            prop === "color" ? "#111111" : "transparent";
        }
      }
      // Also strip background-image gradients that use oklch
      const bgImage = cs.backgroundImage;
      if (bgImage && UNSUPPORTED.test(bgImage)) {
        el.style.backgroundImage = "none";
      }
    });
  };
  try {
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: node.offsetWidth,
      height: node.offsetHeight,
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
      onclone: (clonedDoc) => sanitizeColors(clonedDoc),
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    const nodeRect = node.getBoundingClientRect();
    const pxPerMm = nodeRect.width / pageW;

    const anchors = Array.from(node.querySelectorAll<HTMLAnchorElement>("a[href]"));
    const linkBoxes = anchors
      .map((a) => {
        const r = a.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return null;
        return {
          url: a.href,
          x: (r.left - nodeRect.left) / pxPerMm,
          y: (r.top - nodeRect.top) / pxPerMm,
          w: r.width / pxPerMm,
          h: r.height / pxPerMm,
        };
      })
      .filter((b): b is { url: string; x: number; y: number; w: number; h: number } => !!b);

    if (imgH <= pageH) {
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, imgW, imgH);
      for (const b of linkBoxes) {
        pdf.link(b.x, b.y, b.w, b.h, { url: b.url });
      }
    } else {
      const pageHeightInCanvasPx = (pageH * canvas.width) / pageW;
      let renderedPx = 0;
      let pageIndex = 0;

      while (renderedPx < canvas.height) {
        const sliceHeightPx = Math.min(pageHeightInCanvasPx, canvas.height - renderedPx);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceHeightPx;
        const ctx = slice.getContext("2d");
        if (!ctx) break;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
        const sliceImgH = (sliceHeightPx * imgW) / canvas.width;
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, imgW, sliceImgH);

        const pageStartMm = (renderedPx / canvas.width) * pageW;
        const pageEndMm = pageStartMm + sliceImgH;
        for (const b of linkBoxes) {
          const linkBottom = b.y + b.h;
          if (b.y < pageEndMm && linkBottom > pageStartMm) {
            const yOnPage = b.y - pageStartMm;
            pdf.link(b.x, yOnPage, b.w, b.h, { url: b.url });
          }
        }

        renderedPx += sliceHeightPx;
        pageIndex++;
      }
    }

    pdf.save(`${name || "resume"}.pdf`);
  } finally {
    for (const t of transformedAncestors) {
      t.el.style.transform = t.transform;
      t.el.style.marginBottom = t.marginBottom;
    }
  }
}
