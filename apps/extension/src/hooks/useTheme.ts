import { useEffect } from 'react';
import type { UserSettings } from '@i-speak-hello/shared';

/**
 * Applies the correct dark/light class to <html> based on settings.
 * Handles 'system' mode by listening to OS preference changes.
 */
export function useTheme(theme: UserSettings['theme']) {
  useEffect(() => {
    const root = document.documentElement;

    function applyTheme(isDark: boolean) {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    if (theme === 'dark') {
      applyTheme(true);
      return;
    }

    if (theme === 'light') {
      applyTheme(false);
      return;
    }

    // theme === 'system': follow OS preference
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(mq.matches);

    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);
}
