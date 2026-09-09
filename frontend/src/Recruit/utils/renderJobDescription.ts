// utils/renderJobDescription.ts

const convertMarkdown = (text: string): string => {
  // Strip embedded HTML tags inside ** markers e.g. **<b>Heading</b>** → **Heading**
  text = text
    .replace(/\*\*<[^>]+>([^<]*)<\/[^>]+>\*\*/g, "**$1**")
    .replace(/\*<[^>]+>([^<]*)<\/[^>]+>\*/g, "*$1*")
    .replace(/&amp;/g, "&");

  // Normalize inline • bullets to line-based
  text = text.replace(/\s*•\s+/g, "\n• ");

  const lines = text.split("\n");
  const result: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();

    if (!t) {
      // Only close list if next non-empty line is NOT a bullet
      const nextNonEmpty = lines.slice(i + 1).find((l) => l.trim());
      if (inList && nextNonEmpty && !/^[-•]\s+/.test(nextNonEmpty.trim())) {
        result.push("</ul>");
        inList = false;
      }
      continue;
    }

    // Bullet: - or •  (handles "- **bold**: rest" pattern too)
    if (/^[-•]\s+/.test(t)) {
      if (!inList) { result.push("<ul>"); inList = true; }
      const item = t
        .replace(/^[-•]\s+/, "")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>");
      result.push(`<li>${item}</li>`);
      continue;
    }

    // Close list before non-bullet content
    if (inList) { result.push("</ul>"); inList = false; }

    // Standalone **heading** — entire line is wrapped in **
    if (/^\*\*[^*]+\*\*\s*$/.test(t)) {
      const heading = t.replace(/^\*\*([^*]+)\*\*\s*$/, "$1").trim();
      result.push(`<p><strong>${heading}</strong></p>`);
      continue;
    }

    // Regular paragraph — handle inline **bold** and *italic*
    const para = t
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
    result.push(`<p>${para}</p>`);
  }

  if (inList) result.push("</ul>");
  return result.join("");
};

export const normalizeJobDescription = (content: string): string => {
  if (!content) return "";
  let text = content.trim();

  const hasDivTags  = /<div/i.test(text);
  const hasHashHead = /^#{1,6}\s+/m.test(text);
  const hasMarkdown = /\*\*/.test(text);
  const hasPureTags = /<\/?(?:p|ul|ol|li|strong|b|em|br)\b[^>]*>/i.test(text);

  // ── Format 5: div-wrapped + ### headings (editor output) ──────
  if (hasDivTags || hasHashHead) {
    text = text
      .replace(/<div[^>]*>/gi, "")        // remove opening <div>
      .replace(/<\/div>/gi, "\n")         // </div> → newline
      .replace(/<br\s*\/?>/gi, "\n")      // <br> → newline
      .replace(/---+/g, "")              // remove --- dividers
      .replace(/^#{1,6}\s+/gm, "")       // remove ### markers (keep text)
      .replace(/&amp;/g, "&")
      .trim();
    return convertMarkdown(text);
  }

  // ── Format 2: pure HTML <p><strong>... (new records) ──────────
  if (hasPureTags && !hasMarkdown) {
    return text;
  }

  // ── Format 1/3/4: markdown or mixed markdown+html ─────────────
  return convertMarkdown(text);
};