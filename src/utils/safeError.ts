import { Language } from '../types';

/**
 * Standardized centralized safe error mapping utility.
 * Logs the actual technical error to diagnostics console and returns a friendly, safe localized message.
 */
export function toSafeUserError(
  error: unknown,
  fallbackMessageVi: string,
  fallbackMessageEn: string,
  language: Language = 'vi'
): string {
  // Log real technical error privately for developers
  console.error('[Diagnostic Technical Error]:', error);

  // Return safe non-technical error to the user
  return language === 'vi' ? fallbackMessageVi : fallbackMessageEn;
}
