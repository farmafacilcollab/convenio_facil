/**
 * Formats a number as Brazilian Real currency: R$ 1.234,56
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Parses a Brazilian formatted currency string to number.
 * "R$ 1.234,56" => 1234.56
 * "1234,56" => 1234.56
 */
export function parseBRL(value: string): number {
  const cleaned = value
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

/**
 * Masks currency input as user types (Brazilian format).
 * Input is treated as cents: typing "12345" becomes "123,45"
 */
export function maskCurrency(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  if (!cleaned) return "";

  const numericValue = parseInt(cleaned, 10);
  const formatted = (numericValue / 100).toFixed(2);

  const [intPart, decPart] = formatted.split(".");
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `R$ ${formattedInt},${decPart}`;
}

/**
 * Converts masked currency string to raw cents string for input tracking.
 */
export function currencyToRaw(value: string): string {
  return value.replace(/\D/g, "");
}
