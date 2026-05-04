/**
 * Must match Firestore rules admin allowlist (same Google account).
 * Add alternate casings if your provider returns a different form.
 */
export const ADMIN_EMAILS = ['aeliyag@uchicago.edu'];

export function isAdminEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const n = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((e) => e.toLowerCase() === n);
}
