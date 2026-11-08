/**
 * SVG Sanitizer & Security Validator
 * Removes active content, script tags, event handlers, and malicious references from SVGs.
 */

const DANGEROUS_TAGS = [
  "script",
  "iframe",
  "embed",
  "object",
  "applet",
  "meta",
  "link",
  "form",
  "input",
  "button"
];

const DANGEROUS_ATTR_PATTERN = /\s(on[a-z]+)\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi;
const JAVASCRIPT_URL_PATTERN = /(href|xlink:href|src)\s*=\s*['"]\s*(javascript|data:text\/html|vbscript):/gi;

/**
 * Validates whether string is potentially valid SVG.
 */
export function isValidSvgString(content) {
  if (!content || typeof content !== "string") return false;
  const trimmed = content.trim();
  return trimmed.includes("<svg") && trimmed.includes("</svg>");
}

/**
 * Sanitizes SVG string by stripping all executable and dangerous content.
 * Returns clean sanitized SVG string, or throws Error if invalid.
 */
export function sanitizeSvg(rawSvg) {
  if (!isValidSvgString(rawSvg)) {
    throw new Error("Konten tidak valid sebagai format SVG.");
  }

  let cleaned = rawSvg;

  // 1. Remove dangerous tags and their contents
  DANGEROUS_TAGS.forEach(tag => {
    // Tag with closing pair: <script>...</script>
    const pairRegex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    cleaned = cleaned.replace(pairRegex, "");

    // Self-closing tag: <script />
    const selfClosingRegex = new RegExp(`<${tag}[^>]*\\/?>`, "gi");
    cleaned = cleaned.replace(selfClosingRegex, "");
  });

  // 2. Remove all inline event handlers (onload, onclick, onerror, etc.)
  cleaned = cleaned.replace(DANGEROUS_ATTR_PATTERN, "");

  // 3. Remove javascript: or vbscript: in href/xlink:href/src
  cleaned = cleaned.replace(JAVASCRIPT_URL_PATTERN, '$1=""');

  // 4. Clean dangerous entity encoding tricks
  cleaned = cleaned.replace(/&#x6a;&#x61;&#x76;&#x61;/gi, "");

  return cleaned.trim();
}

