import { createServerFn } from "@tanstack/react-start";

/**
 * OCR a PDF (or image) using Lovable AI Gateway (Gemini).
 * Accepts a base64-encoded file + mime type, returns extracted plain text.
 */
export const ocrDocument = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const v = input as { base64?: string; mimeType?: string };
    if (!v?.base64 || typeof v.base64 !== "string") throw new Error("base64 is required");
    if (!v?.mimeType || typeof v.mimeType !== "string") throw new Error("mimeType is required");
    return { base64: v.base64, mimeType: v.mimeType };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured. Enable Lovable Cloud.");
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an OCR engine. Extract ALL readable text from the provided document, preserving line breaks and section headings. Return ONLY the extracted plain text — no commentary, no markdown fences.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all text from this resume document." },
              {
                type: "image_url",
                image_url: { url: `data:${data.mimeType};base64,${data.base64}` },
              },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) {
      throw new Error("AI is rate limited. Please try again in a moment.");
    }
    if (res.status === 402) {
      throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    }
    if (!res.ok) {
      const t = await res.text();
      console.error("OCR gateway error:", res.status, t);
      throw new Error("AI OCR failed. Try uploading a DOCX instead.");
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    return { text };
  });
