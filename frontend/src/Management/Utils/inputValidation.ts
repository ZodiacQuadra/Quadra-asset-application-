/**
 * inputValidation.ts
 * -----------------------------------------------------------------------------
 * Client-side input hardening for user-entered text.
 *
 * IMPORTANT: This is DEFENCE-IN-DEPTH ONLY. It is not, and cannot be, a real
 * protection against SQL injection on a public API — an attacker can call the
 * backend endpoint directly and bypass every check here. The authoritative fix
 * is PARAMETERISED / PREPARED STATEMENTS on the server. These helpers exist to
 * (a) give the user immediate, friendly feedback and (b) stop obviously
 * malicious payloads before they leave the browser.
 *
 * Design notes:
 *  - Structured fields (name, city, state, street) use an ALLOWLIST of
 *    acceptable characters. Allowlisting is far more reliable than trying to
 *    blocklist "bad" input.
 *  - The meta/keyword detector is a SECONDARY guard for free-text fields. It is
 *    deliberately tuned to avoid false positives on ordinary punctuation — a
 *    lone apostrophe ("St. Mary's Road") is allowed; only injection-shaped
 *    sequences (comment markers, stacked statements, UNION SELECT, tautologies,
 *    etc.) are rejected.
 */

/**
 * Injection-shaped sequences. Tuned to ignore ordinary punctuation so free-text
 * prose isn't falsely rejected: bare semicolons, double-dashes and block-comment
 * markers are intentionally NOT listed here (they occur in normal writing).
 * Structured fields exclude such characters via their allowlists instead.
 */
const SQL_INJECTION_SIGNATURES: RegExp[] = [
  /\bunion\b\s+\bselect\b/i, // UNION SELECT
  /\b(select|insert|update|delete|drop|alter|create|truncate|merge|grant|revoke)\b\s+\b(from|into|table|database|values|set|column)\b/i,
  /\bexec(ute)?\s*\(/i, // EXEC( ... )
  /\bxp_\w+/i, // extended stored procedures
  /\bsp_\w+/i, // system stored procedures
  /'\s*(or|and)\s+.{0,20}?=/i, // ' OR 1=1 / ' AND 'a'='a tautologies
  /\b(or|and)\b\s+\d+\s*=\s*\d+/i, // OR 1=1 (unquoted)
  /\bwaitfor\s+delay\b/i, // time-based blind
  /0x[0-9a-f]{4,}/i, // hex-encoded payloads
  /\bchar\s*\(\s*\d+/i, // CHAR(65) obfuscation
];

/** Allowlists for structured fields. */
export const ALLOWLIST = {
  /** Person/place name-like text: letters, digits, spaces, . , ' & ( ) / -. */
  name: /^[\p{L}\p{N}\s.,'&()\/-]+$/u,
  /** City / state: letters, spaces, and . ' - (no digits). */
  place: /^[\p{L}\s.'-]+$/u,
  /** Street/address line: name allowlist plus # and newlines. */
  street: /^[\p{L}\p{N}\s.,'&()\/#\n\r-]+$/u,
  /** Location code: alphanumerics, hyphen, underscore. */
  code: /^[A-Z0-9_-]+$/i,
  /** 6-digit Indian PIN code. */
  pincode: /^\d{6}$/,
  /** "lat, lng" decimal pair. */
  coordinates: /^-?\d{1,3}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?$/,
} as const;

/** True if the value contains an injection-shaped sequence. */
export const detectSqlInjection = (value: string): boolean =>
  SQL_INJECTION_SIGNATURES.some((rx) => rx.test(value));

export interface SafeTextOptions {
  /** Field name shown in error messages, e.g. "Street". */
  label: string;
  /** Allowlist regex the value must fully match (skipped when omitted). */
  allow?: RegExp;
  /** Maximum length. */
  maxLength?: number;
  /** When true, an empty/whitespace value is rejected. */
  required?: boolean;
}

/**
 * Validate a single text value.
 * @returns an error message string, or `undefined` when the value is valid.
 */
export const validateSafeText = (
  raw: string | null | undefined,
  opts: SafeTextOptions
): string | undefined => {
  const value = (raw ?? "").trim();

  if (!value) {
    return opts.required ? `${opts.label} is required` : undefined;
  }
  if (opts.maxLength && value.length > opts.maxLength) {
    return `${opts.label} must be ${opts.maxLength} characters or fewer`;
  }
  if (detectSqlInjection(value)) {
    return `${opts.label} contains characters that aren't allowed`;
  }
  if (opts.allow && !opts.allow.test(value)) {
    return `${opts.label} contains invalid characters`;
  }
  return undefined;
};
