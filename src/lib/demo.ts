export const DEMO_KEY = 'finanx-demo';

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEMO_KEY) === 'true';
}

export function enableDemoMode(): void {
  localStorage.setItem(DEMO_KEY, 'true');
}

export function disableDemoMode(): void {
  localStorage.removeItem(DEMO_KEY);
}
