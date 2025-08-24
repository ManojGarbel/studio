import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PII_REGEX = {
  EMAIL: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  PHONE: /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
};

/**
 * Generates a consistent, unique color from a string hash.
 * @param str The input string (e.g., anon_hash)
 * @returns An HSL color string (e.g., 'hsl(120, 70%, 80%)')
 */
export function anonCreateColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  // Using fixed saturation and lightness for a consistent pastel palette
  return `hsl(${h}, 70%, 80%)`;
}
