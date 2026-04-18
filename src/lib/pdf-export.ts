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

  // High-DPI render for crisp text
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: node.scrollWidth,
    windowHeight: node.scrollHeight,
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Scale image so its width matches page width
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;

  // Conversion factors: source HTML pixels -> PDF mm
  const nodeRect = node.getBoundingClientRect();
  const pxPerMm = nodeRect.width / pageW;

  // Collect every clickable link as {x,y,w,h in mm relative to top-left of node, url}
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
    // Slice canvas into page-sized chunks
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

      // Add link annotations whose y-range falls within this page
      const pageStartMm = (renderedPx / canvas.width) * pageW;
      const pageEndMm = pageStartMm + sliceImgH;
      for (const b of linkBoxes) {
        const linkBottom = b.y + b.h;
        if (linkBoxes && b.y < pageEndMm && linkBottom > pageStartMm) {
          const yOnPage = b.y - pageStartMm;
          pdf.link(b.x, yOnPage, b.w, b.h, { url: b.url });
        }
      }

      renderedPx += sliceHeightPx;
      pageIndex++;
    }
  }

  pdf.save(`${name || "resume"}.pdf`);
}
