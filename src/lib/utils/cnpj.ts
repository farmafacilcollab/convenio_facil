/**
 * Validates a Brazilian CNPJ number using the digit verification algorithm.
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return false;

  // Reject known invalid patterns (all same digits)
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  // First verification digit
  let sum = 0;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(cleaned.charAt(12)) !== digit1) return false;

  // Second verification digit
  sum = 0;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(cleaned.charAt(13)) !== digit2) return false;

  return true;
}

/**
 * Formats a CNPJ string: XX.XXX.XXX/XXXX-XX
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, "");
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

/**
 * Removes formatting from a CNPJ string.
 */
export function unmaskCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

/**
 * Masks CNPJ input as user types.
 */
export function maskCNPJ(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 14);
  let masked = cleaned;
  if (cleaned.length > 2) masked = cleaned.slice(0, 2) + "." + cleaned.slice(2);
  if (cleaned.length > 5) masked = masked.slice(0, 6) + "." + cleaned.slice(5);
  if (cleaned.length > 8)
    masked = masked.slice(0, 10) + "/" + cleaned.slice(8);
  if (cleaned.length > 12)
    masked = masked.slice(0, 15) + "-" + cleaned.slice(12);
  return masked;
}
