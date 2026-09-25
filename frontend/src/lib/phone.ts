const PHONE_PATTERN = /^[6-9]\d{9}$/;

export function normalizeIndianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return PHONE_PATTERN.test(local) ? `+91${local}` : null;
}
