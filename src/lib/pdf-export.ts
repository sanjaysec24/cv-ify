import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Renders the live resume preview node to a canvas and paginates it
 * across A4 pages in a jsPDF document.
 */
export async function exportResumePdf(name: string) {
  const node = document.querySelector<HTMLElement>("[data-resume-root]");
  if (!node) throw new Error("Resume preview not found");

  // Render at high DPI for crisp text
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

  // Scale image so its width matches the page width.
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;

  if (imgH <= pageH) {
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, imgW, imgH);
  } else {
    // Slice the canvas into page-sized chunks.
    const pageHeightInCanvasPx = (pageH * canvas.width) / pageW;
    let rendered = 0;
    let pageIndex = 0;
    while (rendered < canvas.height) {
      const sliceHeight = Math.min(pageHeightInCanvasPx, canvas.height - rendered);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceHeight;
      const ctx = slice.getContext("2d");
      if (!ctx) break;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, rendered, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      const sliceImgH = (sliceHeight * imgW) / canvas.width;
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, imgW, sliceImgH);
      rendered += sliceHeight;
      pageIndex++;
    }
  }

  pdf.save(`${name || "resume"}.pdf`);
}
