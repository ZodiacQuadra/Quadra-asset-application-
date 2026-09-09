// components/JobDescriptionRenderer.tsx
import React from "react";
import DOMPurify from "dompurify";

// ─── Section header keywords for plain-text/div formats ──────────────────────
const SECTION_HEADERS = [
    "The Opportunity", "Key Responsibilities", "Skills and Attributes for Success",
    "Core Technical Skills", "Desirable/Preferred Skills", "Preferred Skills",
    "Soft Skills", "Qualifications and Experience", "What We Offer",
    "Technical Expertise", "Required Qualifications", "Benefits",
    "Job Overview", "Job Description", "Summary", "Responsibilities", "Requirements",
];

// Split "Header  Content on same line" → "Header\nContent"
const splitHeadersFromContent = (text: string): string => {
    let result = text;
    SECTION_HEADERS.forEach((header) => {
        const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        result = result.replace(
            new RegExp(`(${escaped})[ \\t]+([A-Za-z])`, "g"),
            "$1\n$2"
        );
    });
    return result;
};

const isSection = (line: string): boolean => {
    const t = line.trim();
    if (!t || t.length > 80) return false;
    if (t.endsWith(".") || t.endsWith(",")) return false;
    if (/^[-•*]/.test(t)) return false;
    if (SECTION_HEADERS.some((h) => t.toLowerCase().includes(h.toLowerCase()))) return true;
    if (/^[A-Z][a-zA-Z\s&/()\-]+$/.test(t) && t.length < 60 && t.split(" ").length >= 2) return true;
    return false;
};

// ─── Core markdown/plain converter ───────────────────────────────────────────
const convertToHtml = (text: string): string => {
    // Strip embedded HTML tags inside ** markers: **<b>Heading</b>** → **Heading**
    text = text
        .replace(/\*\*<[^>]+>([^<]*)<\/[^>]+>\*\*/g, "**$1**")
        .replace(/\*<[^>]+>([^<]*)<\/[^>]+>\*/g, "*$1*")
        .replace(/&amp;/g, "&");

    // Normalize inline • bullets to line-based
    text = text.replace(/\s*•\s+/g, "\n• ");

    // Split headers glued to content on same line
    text = splitHeadersFromContent(text);

    const lines = text.split("\n");
    const result: string[] = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        const t = lines[i].trim();

        if (!t) {
            const nextNonEmpty = lines.slice(i + 1).find((l) => l.trim());
            if (inList && nextNonEmpty && !/^[-•]\s+/.test(nextNonEmpty.trim())) {
                result.push("</ul>");
                inList = false;
            }
            continue;
        }

        // Bullet: - or •
        if (/^[-•]\s+/.test(t)) {
            if (!inList) { result.push("<ul>"); inList = true; }
            const item = t
                .replace(/^[-•]\s+/, "")
                .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                .replace(/\*([^*]+)\*/g, "<em>$1</em>");
            result.push(`<li>${item}</li>`);
            continue;
        }

        if (inList) { result.push("</ul>"); inList = false; }

        // Standalone **heading** — entire line wrapped in **
        if (/^\*\*[^*]+\*\*\s*$/.test(t)) {
            const heading = t.replace(/^\*\*([^*]+)\*\*\s*$/, "$1").trim();
            result.push(`<p><strong>${heading}</strong></p>`);
            continue;
        }

        // Plain-text section header (title case short line)
        if (isSection(t)) {
            result.push(`<p><strong>${t}</strong></p>`);
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

// ─── Master normalizer — detects format and routes correctly ─────────────────
const normalizeJobDescription = (content: string): string => {
    if (!content) return "";
    let text = content.trim();

    const hasDivTags = /<div/i.test(text);
    const hasHashHead = /^#{1,6}\s+/m.test(text);
    const hasMarkdown = /\*\*/.test(text);
    const hasPureTags = /<\/?(?:p|ul|ol|li|strong|b|em|br)\b[^>]*>/i.test(text);

    // ── Format: div-wrapped (plain text or markdown inside divs) ─────
    if (hasDivTags || hasHashHead) {
        text = text
            .replace(/<div[^>]*>/gi, "")
            .replace(/<\/div>/gi, "\n")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/---+/g, "")
            .replace(/^#{1,6}\s+/gm, "")
            .replace(/&amp;/g, "&")
            .trim();
        return convertToHtml(text);
    }

    // ── Format: pure HTML — no ** markers ────────────────────────────
    if (hasPureTags && !hasMarkdown) {
        return text;
    }

    // ── Format: markdown or mixed markdown+html ───────────────────────
    return convertToHtml(text);
};

// ─── Component ────────────────────────────────────────────────────────────────
interface JobDescriptionRendererProps {
    content: string;
    className?: string;
}

const JobDescriptionRenderer: React.FC<JobDescriptionRendererProps> = ({
    content,
    className = "",
}) => {
    const html = normalizeJobDescription(content);

    return (
        <>
            <style>{`
  .jd-renderer p  { margin: 0 0 0.3rem 0 !important; }
  .jd-renderer p > strong,
  .jd-renderer p > b  { 
    font-weight: 700 !important; 
    font-size: 16px !important;
    color: #111827 !important;
    display: inline-block;
    margin-top: 0.6rem !important;
  }
  .jd-renderer li strong,
  .jd-renderer li b { 
    font-weight: 700 !important; 
    font-size: 14px !important;
  }
  .jd-renderer ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin: 0.2rem 0 0.3rem 0 !important; }
  .jd-renderer ol { list-style-type: decimal !important; padding-left: 1.5rem !important; }
  .jd-renderer li { margin: 0.15rem 0 !important; display: list-item !important; font-size: 14px !important; }
  .jd-renderer em,
  .jd-renderer i  { font-style: italic !important; }
  .jd-renderer br { display: block; margin: 0.2rem 0 !important; }
`}</style>
            <div
                className={`jd-renderer ${className}`}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
                style={{ lineHeight: "1.6", color: "#111827", fontSize: "14px" }}
            />
        </>
    );
};

export default JobDescriptionRenderer;