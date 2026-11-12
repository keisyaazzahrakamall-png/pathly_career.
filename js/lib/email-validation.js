const GMAIL_TYPO_DOMAINS = new Set([
  "gamil.com",
  "gmai.com",
  "gmail",
  "gmail.cm",
  "gmail.co",
  "gmail.cim",
  "gmail.con",
  "gmail.cpm",
  "gmail.om",
  "gmaill.com",
  "gmaiil.com",
  "gmal.com",
  "gmial.com",
  "gmil.com",
  "gmoil.com",
  "gmol",
  "gmol.com"
]);

export function suggestEmailAddress(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const separatorIndex = normalizedEmail.lastIndexOf("@");

  if (separatorIndex <= 0) return "";

  const localPart = normalizedEmail.slice(0, separatorIndex);
  const domain = normalizedEmail.slice(separatorIndex + 1);

  if (!GMAIL_TYPO_DOMAINS.has(domain)) return "";

  return `${localPart}@gmail.com`;
}

export function getEmailTypoMessage(email) {
  const suggestion = suggestEmailAddress(email);

  return suggestion
    ? `This email address may contain a typo. Did you mean ${suggestion}?`
    : "";
}
