import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  browser: 'chrome',
  webExt: {
    binaries: {
      chrome: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'I Speak Hello',
    description: 'Learn new words with spaced repetition flashcards on every new tab',
    permissions: ['storage', 'alarms', 'notifications'],
    icons: {
      '16': '/icon-16.png',
      '32': '/icon-32.png',
      '48': '/icon-48.png',
      '128': '/icon-128.png',
    },
    chrome_url_overrides: {
      newtab: 'newtab.html',
    },
  },
});
