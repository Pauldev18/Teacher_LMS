// DescriptionPreview.jsx
import { useMemo } from "react";
import DOMPurify from "dompurify";

/**
 * Cắt HTML nhưng giữ nguyên cấu trúc thẻ.
 * - Cắt theo số ký tự text (không tính tag) => giống "slice" trên plain text
 * - Vẫn render HTML: bold/italic/link... giữ nguyên
 */
function truncateHtmlPreserveTags(html, maxChars = 200, ellipsis = "…") {
  if (!html) return "";

  const src = document.createElement("div");
  src.innerHTML = html;

  let remaining = Math.max(0, maxChars);
  let stop = false;

  const walk = (node) => {
    if (stop) return null;

    // Text node
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue || "";
      if (text.length <= remaining) {
        remaining -= text.length;
        return document.createTextNode(text);
      } else {
        const cut = text.slice(0, remaining) + (ellipsis || "");
        remaining = 0;
        stop = true;
        return document.createTextNode(cut);
      }
    }

    // Element node
    if (node.nodeType === Node.ELEMENT_NODE) {
      const clone = node.cloneNode(false); // shallow clone (keep attributes)
      for (const child of node.childNodes) {
        const childClone = walk(child);
        if (childClone) clone.appendChild(childClone);
        if (stop) break;
      }
      return clone;
    }

    // Bỏ qua comment/others
    return null;
  };

  const out = document.createElement("div");
  for (const child of src.childNodes) {
    const childClone = walk(child);
    if (childClone) out.appendChild(childClone);
    if (stop) break;
  }
  return out.innerHTML;
}

export default function DescriptionPreview({
  html = "",
  maxChars = 200,
  ellipsis = "…",
  sanitize = true,
  className = "prose prose-sm mb-4",
  wrapper = "div",
}) {
  const truncatedHtml = useMemo(() => {
    const trimmed = truncateHtmlPreserveTags(html, maxChars, ellipsis);
    return sanitize ? DOMPurify.sanitize(trimmed) : trimmed;
  }, [html, maxChars, ellipsis, sanitize]);

  const Wrapper = wrapper;

  return (
    <Wrapper
      className={className}
      // vẫn render HTML nhưng đã cắt và (tuỳ chọn) sanitize
      dangerouslySetInnerHTML={{ __html: truncatedHtml }}
    />
  );
}
