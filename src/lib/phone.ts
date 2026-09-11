export function normalizePhoneNumber(value: string, defaultCountryCode = "91") {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = `${defaultCountryCode}${digits.slice(1)}`;
  if (digits.length === 10) digits = `${defaultCountryCode}${digits}`;

  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
}
