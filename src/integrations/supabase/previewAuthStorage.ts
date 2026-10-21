export function authStorage() {
  if (typeof window === 'undefined') return undefined;
  return localStorage;
}
