import ReactDOM from 'react-dom/client';
import { SiteBlockerOverlay } from './SiteBlockerOverlay';
import type { UserSettings, Word } from '@i-speak-hello/shared';
import { getDefaultSettings } from '@i-speak-hello/shared';
import './style.css';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'manifest',

  async main() {
    // Skip extension pages
    if (window.location.protocol === 'chrome-extension:' || window.location.protocol === 'chrome:') {
      return;
    }

    // Load settings and check if current site is blocked
    const { settings } = await chrome.storage.local.get('settings');
    const config: UserSettings = settings ?? getDefaultSettings();

    if (!config.siteBlocker?.enabled || !config.siteBlocker?.blockedSites?.length) {
      return;
    }

    const hostname = window.location.hostname.replace(/^www\./, '').toLowerCase();

    const isBlocked = config.siteBlocker.blockedSites.some(site => {
      const cleanSite = site.replace(/^www\./, '').toLowerCase();
      return hostname === cleanSite || hostname.endsWith('.' + cleanSite);
    });

    if (!isBlocked) return;

    // Check if already unlocked recently (using configurable unlock duration)
    const unlockKey = 'site_unlocks';
    const { [unlockKey]: unlocks = {} } = await chrome.storage.local.get(unlockKey);
    const lastUnlock = unlocks[hostname] as number | undefined;
    if (lastUnlock) {
      const unlockDurationMs = (config.siteBlocker.unlockDurationMinutes ?? 30) * 60 * 1000;
      if (Date.now() - lastUnlock < unlockDurationMs) {
        return;
      }
    }

    // Load words for the quiz
    const { words = [] } = await chrome.storage.local.get('words');
    if ((words as Word[]).length === 0) return;

    // Inject the overlay using Shadow DOM for full CSS isolation from host page
    const host = document.createElement('div');
    host.id = 'i-speak-hello-blocker';
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    // Reset all styles inside shadow DOM so host page CSS cannot leak in
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      button { font-family: inherit; cursor: pointer; }
    `;
    shadow.appendChild(style);

    const mountPoint = document.createElement('div');
    shadow.appendChild(mountPoint);

    // Stop keyboard events from leaking through to the host page
    // (e.g. YouTube 'M' to mute, 'K' to pause, etc.)
    for (const evt of ['keydown', 'keyup', 'keypress'] as const) {
      shadow.addEventListener(evt, e => e.stopPropagation());
    }

    // Prevent scrolling on the page behind the overlay
    document.documentElement.style.overflow = 'hidden';

    const root = ReactDOM.createRoot(mountPoint);
    root.render(
      <SiteBlockerOverlay
        settings={config}
        words={words as Word[]}
        hostname={hostname}
        onUnlock={async () => {
          // Mark as unlocked for the configured duration
          const { [unlockKey]: currentUnlocks = {} } = await chrome.storage.local.get(unlockKey);
          currentUnlocks[hostname] = Date.now();
          await chrome.storage.local.set({ [unlockKey]: currentUnlocks });

          // Restore scrolling
          document.documentElement.style.overflow = '';

          root.unmount();
          host.remove();
        }}
      />
    );
  },
});
