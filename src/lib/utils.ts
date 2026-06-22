import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

/**
 * Merge Tailwind class names safely.
 * - clsx handles conditional/ambiguous inputs.
 * - tailwind-merge resolves conflicting Tailwind utilities (later wins).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
