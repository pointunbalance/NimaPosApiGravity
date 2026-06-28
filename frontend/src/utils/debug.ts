const DEBUG = import.meta.env.VITE_DEBUG === 'true';

export function debug(...args: unknown[]): void {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}
