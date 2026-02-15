# 👋 I Speak Hello

**Learn new languages by stacking it onto habits you already have.**

I Speak Hello is a Chrome extension that helps you learn Mandarin Chinese and English vocabulary by embedding flashcards and quizzes into things you already do every day — opening new tabs and browsing websites.

> *"The best way to build a new habit is to stack it on top of an existing one."*
> — James Clear, Atomic Habits

Every time you open a new tab, you see a quick vocabulary quiz instead of a blank page. Every time you visit YouTube or Reddit, you answer a few questions first. You're not adding a new task to your day — you're attaching learning to routines that already exist.

---

## Why This Works

Most language learning apps ask you to set aside dedicated study time. The problem? You forget. You skip a day, then two, then a week. The app collects dust.

I Speak Hello takes a different approach based on three ideas:

### 1. Habit Stacking
You already open dozens of new tabs a day. You already visit social media. Instead of fighting for space in your schedule, this extension piggybacks on those existing habits. Open a tab → see a flashcard. Visit Reddit → answer a quick quiz. Zero extra effort.

### 2. Spaced Repetition
Not all words need equal attention. The SM-2 algorithm tracks how well you know each word and shows it to you right before you'd forget it. New words appear frequently. Words you've mastered fade into longer intervals. Your brain gets exactly the review it needs, nothing more.

### 3. Micro-Learning Over Marathon Sessions
Research shows that short, frequent study sessions beat long, infrequent ones. A 10-second flashcard while your page loads is more effective than a 30-minute session you dread. This extension makes every idle moment a learning opportunity.

---

## Features

### 🧠 Four Quiz Types
- **Flashcard** — Flip to reveal the answer, rate how well you remembered
- **Multiple Choice** — Pick the correct translation from 4 options
- **Type the Answer** — Write the translation yourself (with fuzzy matching so typos don't punish you)
- **Complete the Sentence** — Fill in the blank in an AI-generated example sentence

### 🔒 Site Quiz (Habit Stacking in Action)
Add websites like `youtube.com` or `reddit.com` to your blocked list. Before the site loads, you answer 1-5 vocabulary questions. Think of it as a tiny toll booth — a few seconds of learning in exchange for your browsing time. You configure how many questions, how long the unlock lasts, and whether you can skip.

### 🤖 AI-Powered Word Enrichment
Connect an [OpenRouter](https://openrouter.ai/keys) API key and the AI handles the heavy lifting:
- **Auto-translate** — Just type the foreign word, AI generates the Indonesian translation
- **Pinyin generation** — Automatic pinyin with tone marks for Mandarin
- **Example sentences** — 2 contextual sentences per word with translations
- **Smart distractors** — AI creates plausible wrong answers for multiple choice
- **Synonym acceptance** — "besar" and "raksasa" both count as correct for 大 — no more frustration from exact-match grading

Without an API key, everything still works — you just enter translations manually.

### 📊 Spaced Repetition (SM-2)
Each word tracks its own review schedule. Answer correctly → the interval grows (1 day → 6 days → 2 weeks → ...). Answer wrong → it resets to 1 day. The algorithm adapts to your performance per word, so you spend time on what you actually need to review.

### 🔥 Gamification
- **Streaks** — Keep your daily review streak alive
- **XP system** — Earn 5-20 XP per correct answer depending on quiz difficulty
- **Levels** — Progress through 10 levels as you accumulate XP
- **Daily goals** — Set a target number of reviews per day and track your progress

### 🇨🇳 Mandarin-Specific Features
- Color-coded pinyin tones (1st=red, 2nd=orange, 3rd=green, 4th=blue)
- Sentence pinyin display in quizzes and word cards
- Text-to-speech with native zh-CN pronunciation

### 🌙 Dark Mode
Full dark mode support across every page — new tab, popup, options, and site blocker overlay. Follows your system preference or set it manually.

### 💾 Data Safety
- Auto-backup to IndexedDB every 30 minutes (survives extension uninstall)
- Manual export/import as JSON file
- All data stays local — nothing is sent to any server except the LLM API calls when you have an API key configured

### ⚙️ Configurable Everything
- Quiz difficulty bias (prefer easy flashcards or challenging typing quizzes)
- New word ratio per session (how many new words vs. reviews)
- Words per session
- Study reminder notifications
- Auto-speak on quiz
- Site blocker unlock duration

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v8+)
- Chrome or any Chromium-based browser (Brave, Edge, etc.)

### Install & Build

```bash
# Clone the repository
git clone https://github.com/your-username/i-speak-hello.git
cd i-speak-hello

# Install dependencies
pnpm install

# Build the extension
pnpm --filter extension build
```

The built extension will be in `apps/extension/.output/chrome-mv3/`.

### Load in Browser

1. Open `chrome://extensions` (or `brave://extensions`)
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `apps/extension/.output/chrome-mv3/` folder
5. Open a new tab — you'll see I Speak Hello!

### Development

```bash
# Start dev server with hot reload
pnpm --filter extension dev
```

### Optional: AI Features

1. Get a free API key from [OpenRouter](https://openrouter.ai/keys)
2. Open the extension's Settings page (⚙️ icon in popup)
3. Paste your API key in the OpenRouter section
4. Now when you add words, AI will auto-generate translations, pinyin, sentences, and quiz options

---

## How It's Built

| Layer | Technology | Why |
|-------|-----------|-----|
| Extension framework | [WXT](https://wxt.dev/) (Manifest V3) | File-based entrypoints, Vite HMR, great DX |
| UI | React 19 + TypeScript | Component-based, type-safe |
| Styling | Tailwind CSS 4 | Rapid styling with dark mode support |
| State | Zustand 5 | Lightweight, works well in extension contexts |
| SRS | Custom SM-2 | ~50 lines, no external dependency needed |
| AI | OpenRouter API | Cheapest access to Gemini Flash for sentence generation |
| TTS | Web Speech API | Free, built into every browser |
| Storage | Chrome Storage API + IndexedDB | Local-first, IndexedDB survives uninstall |

### Project Structure

```
i-speak-hello/
├── apps/extension/           # Chrome extension
│   ├── entrypoints/
│   │   ├── newtab/           # Main quiz dashboard (new tab override)
│   │   ├── popup/            # Quick-add popup
│   │   ├── options/          # Settings page
│   │   ├── background.ts     # Service worker (alarms, notifications)
│   │   └── site-blocker.content/  # Site quiz overlay (Shadow DOM)
│   └── src/
│       ├── components/       # React components (quiz, words, gamification)
│       ├── stores/           # Zustand stores (words, settings, streak)
│       └── lib/              # Storage, quiz engine, AI, backup, audio
├── packages/shared/          # Shared code
│   └── src/
│       ├── types/            # TypeScript type definitions
│       ├── srs/sm2.ts        # SM-2 spaced repetition algorithm
│       └── constants/        # Languages, XP thresholds
└── pnpm-workspace.yaml
```

---

## Included Seed Data

First-time users can load 50 pre-built words to start immediately:

- **25 Mandarin words** — 你好, 谢谢, 再见, 学生, 老师, 吃, 喝, 大, 小, 好, and more everyday vocabulary with pinyin
- **25 English words** — accomplish, determine, significant, perspective, contribute, and other intermediate/advanced vocabulary

All words come with Indonesian translations. If you have an API key configured, they'll also be enriched with example sentences, distractors, and synonym answers.

---

## Roadmap

- [x] **Phase 1** — Offline MVP (Chrome extension with local storage) ✅
- [ ] **Phase 2** — Supabase backend, auth, cloud sync
- [ ] **Phase 3** — Telegram bot for adding words on-the-go
- [ ] **Phase 4** — Advanced features, achievements, context-based learning

---

## Final Thought

Language learning doesn't have to feel like work. The best systems are the ones you don't have to think about — they're just *there*, woven into what you're already doing.

Every new tab is a chance to see a word. Every website visit is a chance to practice. Over weeks and months, these micro-moments compound. You're not studying — you're just living your life, and learning happens along the way.

That's habit stacking. That's I Speak Hello.

---