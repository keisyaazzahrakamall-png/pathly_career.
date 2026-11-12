const UNSAFE_MARKUP_PATTERN = /[<>`{}]/;
const UNSAFE_PROTOCOL_PATTERN =
  /(?:javascript\s*:|data\s*:\s*text\/html|on\w+\s*=)/i;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export function containsUnsafeCareerInput(value) {
  const text = String(value || "");

  return (
    UNSAFE_MARKUP_PATTERN.test(text) ||
    UNSAFE_PROTOCOL_PATTERN.test(text) ||
    CONTROL_CHARACTER_PATTERN.test(text)
  );
}

export function sanitizeCareerName(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[<>`{}]/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
