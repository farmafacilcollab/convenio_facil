/**
 * Validates a Brazilian CPF number using the digit verification algorithm.
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;

  // Reject known invalid patterns (all same digits)
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // First verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (parseInt(cleaned.charAt(9)) !== remainder) return false;

  // Second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (parseInt(cleaned.charAt(10)) !== remainder) return false;

  return true;
}

/**
 * Formats a CPF string: XXX.XXX.XXX-XX
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  return cleaned.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    "$1.$2.$3-$4"
  );
}

/**
 * Masks CPF for display: ***.XXX.XXX-**
 */
export function maskCPFDisplay(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return `***.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-**`;
}

/**
 * Removes formatting from a CPF string.
 */
export function unmaskCPF(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

/**
 * Masks CPF input as user types.
 */
export function maskCPFInput(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 11);
  let masked = cleaned;
  if (cleaned.length > 3) masked = cleaned.slice(0, 3) + "." + cleaned.slice(3);
  if (cleaned.length > 6) masked = masked.slice(0, 7) + "." + cleaned.slice(6);
  if (cleaned.length > 9)
    masked = masked.slice(0, 11) + "-" + cleaned.slice(9);
  return masked;
}
